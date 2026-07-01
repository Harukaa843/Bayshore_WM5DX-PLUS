import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";
import * as wm from "../wmmt/wm5.proto";
import * as wmsrv from "../wmmt/service.proto";
import * as common from "./util/common";
import * as crown_list from "./resource/crown_list";
import { serverState } from "./util/state";

export default class CrownModule extends Module {
    register(app: Application): void {
        
        // --- CROWN LIST (For Attract Screen) ---
        app.get('/resource/crown_list', async (req, res) => {
            // Only log if this is a genuine Crown flow (not triggered after a ghost_summary by level)
            if (serverState.getMode() !== 1) {
                console.log('[CROWN_SYSTEM] Fetching crown_list');
            }
            let crown_lists = await crown_list.getCrownList();
            let message = wmsrv.wm5.protobuf.CrownList.encode({ crowns: crown_lists.list_crown });
            common.sendResponse(message, res);
        });

        // --- CROWN SUMMARY (When NO ghost_level is provided) ---
        app.get('/resource/ghost_summary', async (req, res, next) => {
            const ghostLevelStr = req.query.ghost_level || req.query.ghostLevel;
            
            // If ghost_level IS provided, pass to GhostModule
            if (ghostLevelStr !== undefined) {
                serverState.setMode(1); // Mark as GHOST LEVEL mode
                return next();
            }

            // Mark as CROWN mode
            serverState.setMode(2); 

            const area = Number(req.query.area) || 0;
            console.log(`[CROWN_SYSTEM] Fetching crown summary for area ${area}`);

            const crowns = await prisma.carCrown.findMany({
                where: { ...(area !== 0 && { area: area }) },
                include: {
                    car: { include: { gtWing: true, lastPlayedPlace: true } }
                }
            });

            const ghosts = crowns.map((crown) => ({
                car: crown.car,
                area: crown.area,
                ramp: crown.ramp || 0,
                nonhuman: false,
                characterEffect: crown.car.rgCharacterEffect
            }));

            console.log(`[CROWN_SYSTEM] Found ${ghosts.length} crowns`);
            const message = wm.wm5.protobuf.GhostSummary.encode({ ghosts: ghosts });
            common.sendResponse(message, res);
        });

        // --- LOCK CROWN (V13: Final Fix for Logic and Logging) ---
        app.post('/method/lock_crown', async (req, res) => {
            const body = wmsrv.wm5.protobuf.LockCrownRequest.decode(req.body);
            const carId = Number(body.carId);
            const area = Number(body.area);
            
            // 1. Check if it's a Crown (Car 0, Dummy ID, or in DB for THIS area)
            const isDefaultBoss = (carId === 0);
            const isDummyBoss = (carId > 900000000);
            const crownInDb = await prisma.carCrown.findFirst({
                where: { carId: carId, area: area }
            });

            const isCrownTarget = (isDefaultBoss || isDummyBoss || crownInDb);

            // LOGGING LOGIC: Only log if not in ghost level mode
            if (serverState.getMode() !== 1) {
                console.log(`[CROWN_SYSTEM] lock_crown request for carId: ${carId}, area: ${area}`);
            }

            // GAME LOGIC:
            // This is the most important part. 
            // If the game sends lock_crown for a car that is NOT a crown holder in this area,
            // we MUST return ERR_REQUEST to tell the game "This is a Normal Ghost Battle, not Crown".
            if (isCrownTarget) {
                if (serverState.getMode() !== 1) {
                    console.log(`[CROWN_SYSTEM] SUCCESS: Crown Battle allowed (Car ${carId}, Area ${area})`);
                }
                
                if (crownInDb) {
                    try {
                        await prisma.carCrown.update({
                            where: { dbId: crownInDb.dbId },
                            data: { lockedAt: Math.floor(Date.now() / 1000) }
                        });
                    } catch (e) {}
                }

                const message = wmsrv.wm5.protobuf.LockCrownResponse.encode({
                    error: wmsrv.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                });
                return common.sendResponse(message, res);
            }

            // FAIL CASE: This car is not a crown holder.
            // Return ERR_REQUEST so the game client proceeds as a Normal Ghost Battle.
            if (serverState.getMode() !== 1) {
                console.log(`[GHOST_SYSTEM] FAIL: Normal Ghost detected (Car ${carId}). Sending ERR_REQUEST to prevent Crown return.`);
            }
            
            const message = wmsrv.wm5.protobuf.LockCrownResponse.encode({
                error: wmsrv.wm5.protobuf.ErrorCode.ERR_REQUEST,
            });
            return common.sendResponse(message, res);
        });
    }
}
