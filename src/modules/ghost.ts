import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";
import Long from "long";

// Import Proto
import * as wm from "../wmmt/wm5.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";
import * as ghost_save_trail from "./ghost/ghost_save_trail";
import * as ghost_trail from "./ghost/ghost_util/ghost_trail";
import * as ghost_area from "./ghost/ghost_util/ghost_area";
import { serverState } from "./util/state";

export default class GhostModule extends Module {
    register(app: Application): void {

        // --- GHOST SUMMARY (NORMAL GHOSTS BY LEVEL) ---
        app.get('/resource/ghost_summary', async (req, res, next) => {
            const ghostLevelStr = req.query.ghost_level || req.query.ghostLevel;
            
            // If NO ghost_level is provided, it's NOT a normal ghost search. Pass to next module (Crown).
            if (ghostLevelStr === undefined) {
                return next();
            }

            // GHOST LEVEL MODE detected
            // Set global state using Singleton to ensure all modules see the same value
            serverState.setMode(1); 
            
            const ghostLevel = Number(ghostLevelStr);
            const area = Number(req.query.area) || 0;
            const regionId = Number(req.query.regionId) || 0;

            console.log(`[GHOST_SYSTEM] Fetching Level ${ghostLevel} ghosts for area ${area}`);

            // 1. Try to find cars with the same level that have trails in THIS area
            let cars = await prisma.car.findMany({
                where: {
                    ghostLevel: ghostLevel,
                    ...(regionId !== 0 && { regionId: regionId }),
                    GhostTrail: { some: { area: area, crownBattle: false } },
                    CarCrown: { none: { area: area } } // Exclude current crown holder
                },
                include: { gtWing: true, lastPlayedPlace: true },
                take: 10
            });

            // 2. If not enough, find any car with the same level (Fallback)
            if (cars.length < 5) {
                console.log(`[GHOST_SYSTEM] Not enough ghosts with trails. Fetching fallback cars for Level ${ghostLevel}`);
                const existingIds = cars.map(c => c.carId);
                const extraCars = await prisma.car.findMany({
                    where: {
                        ghostLevel: ghostLevel,
                        carId: { notIn: existingIds },
                        ...(regionId !== 0 && { regionId: regionId }),
                        CarCrown: { none: { area: area } }
                    },
                    include: { gtWing: true, lastPlayedPlace: true },
                    take: 10 - cars.length
                });
                cars = [...cars, ...extraCars];
            }

            const ghosts = cars.map((car) => ({
                car: car,
                area: area,
                ramp: 0,
                nonhuman: false,
                characterEffect: car.rgCharacterEffect
            }));

            console.log(`[GHOST_SYSTEM] Found ${ghosts.length} ghosts for Level ${ghostLevel}`);
            const message = wm.wm5.protobuf.GhostSummary.encode({ ghosts: ghosts });
            common.sendResponse(message, res);
        });

        // --- SEARCH CARS BY LEVEL (POST Method) ---
        app.post('/method/search_cars_by_level', async (req, res) => {
            const body = (wm.wm5.protobuf as any).SearchCarsByLevelRequest.decode(req.body);
            console.log(`[GHOST_SYSTEM] method/search_cars_by_level: Level ${body.ghostLevel}`);
            
            const cars = await prisma.car.findMany({
                where: {
                    ghostLevel: body.ghostLevel,
                    ...(body.regionId && body.regionId !== 0 && { regionId: body.regionId }),
                    CarCrown: { none: {} }
                },
                include: { gtWing: true, lastPlayedPlace: true },
                take: 10
            });

            const ghost_areas = await ghost_area.GhostArea(body.area);
            const lists_ghostcar = cars.map(car => wm.wm5.protobuf.GhostCar.create({
                car: car,
                type: wm.wm5.protobuf.GhostType.GHOST_NORMAL
            }));

            const msg = { 
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS, 
                ramp: ghost_areas.rampVal, 
                path: ghost_areas.pathVal, 
                ghosts: lists_ghostcar, 
                selectionMethod: 2 
            };
            const message = (wm.wm5.protobuf as any).SearchCarsByLevelResponse.encode(msg);
            common.sendResponse(message, res);
        });

        // --- SEARCH CARS (General) ---
        app.post('/method/search_cars', async (req, res) => {
            const body = (wm.wm5.protobuf as any).SearchCarsRequest.decode(req.body);
            console.log(`[GHOST_SYSTEM] method/search_cars: Area ${body.area}`);
            
            const cars = await prisma.car.findMany({
                where: { CarCrown: { none: {} } },
                include: { gtWing: true, lastPlayedPlace: true },
                take: 10
            });

            const ghost_areas = await ghost_area.GhostArea(body.area);
            const lists_ghostcar = cars.map(car => wm.wm5.protobuf.GhostCar.create({
                car: car,
                area: body.area,
                ramp: ghost_areas.rampVal,
                type: wm.wm5.protobuf.GhostType.GHOST_NORMAL
            }));

            const msg = { error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS, ramp: ghost_areas.rampVal, path: ghost_areas.pathVal, ghosts: lists_ghostcar, selectionMethod: 0 };
            const message = (wm.wm5.protobuf as any).SearchCarsResponse.encode(msg);
            common.sendResponse(message, res);
        });

        // --- LOAD GHOST TRAIL DATA ---
        app.get('/resource/ghost_trail', async (req, res) => {
            const pCarId = Number(req.query.car_id);
            const pArea = Number(req.query.area);
            const pTrailId = Number(req.query.trail_id);

            console.log(`[GHOST_SYSTEM] Fetching trail for Car ${pCarId}, Area ${pArea}`);

            let gt;
            if (pTrailId) {
                gt = await ghost_trail.getOCMGhostTrail(pCarId, pTrailId);
            } else {
                const isCrown = await prisma.carCrown.findFirst({ where: { carId: pCarId, area: pArea } });
                if (isCrown) {
                    gt = await ghost_trail.getCrownGhostTrail(pCarId, pArea);
                } else {
                    gt = await ghost_trail.getNormalGhostTrail(pCarId, pArea);
                }
            }

            const message = wm.wm5.protobuf.GhostTrail.encode({
                carId: pCarId,
                area: pArea,
                ramp: gt.rampVal,
                playedAt: gt.playedAt,
                trail: gt.ghostTrail
            });
            common.sendResponse(message, res);
        });

        // --- REGISTER GHOST TRAIL ---
        app.post('/method/register_ghost_trail', async (req, res) => {
            const body = wm.wm5.protobuf.RegisterGhostTrailRequest.decode(req.body);
            const actualSessionId = Long.isLong(body.ghostSessionId) ? common.getBigIntFromLong(body.ghostSessionId) : 0;
            
            if (actualSessionId > 100 && actualSessionId < 201) {
                await ghost_save_trail.saveOCMGhostTrail(body);
            } else {
                const bodyAny = body as any;
                if (!(bodyAny.trendBinaryByArea) && !(bodyAny.trendBinaryByCar) && !(bodyAny.trendBinaryByUser)) {
                    await ghost_save_trail.saveCrownGhostTrail(body);
                } else {
                    await ghost_save_trail.saveNormalGhostTrail(body);
                    await ghost_save_trail.savePathAndTuning(body);
                }
            }
            common.sendResponse(wm.wm5.protobuf.RegisterGhostTrailResponse.encode({ error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS }), res);
        });

        // --- GHOST BATTLE INFO ---
        app.post('/method/load_ghost_battle_info', async (req, res) => {
            let body = wm.wm5.protobuf.LoadGhostBattleInfoRequest.decode(req.body);
            let car = await prisma.car.findFirst({ where: { carId: body.carId } });
            
            // Simplified for stability
            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                stampSheetCount: car?.stampSheetCount || 0,
                stampSheet: car?.stampSheet || null,
                promotedToBuddy: false
            };
            common.sendResponse(wm.wm5.protobuf.LoadGhostBattleInfoResponse.encode(msg), res);
        });

        // --- LOAD STAMP TARGET ---
        app.post('/method/load_stamp_target', async (req, res) => {
            let msg = { error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS, cars: [], challengers: [] };
            common.sendResponse(wm.wm5.protobuf.LoadStampTargetResponse.encode(msg), res);
        });
    }
}
