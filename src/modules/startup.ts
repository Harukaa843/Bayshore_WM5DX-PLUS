import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/wm5.proto";

// Import Util
import * as common from "./util/common";


export default class StartupModule extends Module {
    register(app: Application): void {

        // Register system info upon booting
        app.post('/method/register_system_info', async (req, res) => {

            // Get the request body
            let body = wm.wm5.protobuf.RegisterSystemInfoRequest.decode(req.body);

            // Get current timestamp
            let date = Math.floor(new Date().getTime() / 1000);

            // --- OCM Event Check ---
            // Try to find an active OCM event
            let ocmEventDate = await prisma.oCMEvent.findFirst({
                where: {
                    qualifyingPeriodStartAt: { lte: date },
                    competitionEndAt: { gte: date },
                },
                orderBy: {
                    competitionEndAt: 'desc',
                }
            });

            let pastEvent = 0;
            if (!ocmEventDate) {
                // Fall back to the most recent past event
                ocmEventDate = await prisma.oCMEvent.findFirst({
                    orderBy: {
                        competitionId: 'desc'
                    }
                });
                pastEvent = 1;
            }

            let competitionSchedule: wm.wm5.protobuf.IGhostCompetitionSchedule | null = null;
            let lastCompetitionId: number = 0;

            if (ocmEventDate) {
                let pastDay = date - ocmEventDate.competitionEndAt;

                // Only include the schedule if the event ended less than 7 days ago
                if (pastDay < 604800) {
                    console.log("OCM Event Available");

                    competitionSchedule = wm.wm5.protobuf.GhostCompetitionSchedule.create({
                        competitionId: ocmEventDate.competitionId,
                        qualifyingPeriodStartAt: ocmEventDate.qualifyingPeriodStartAt,
                        qualifyingPeriodCloseAt: ocmEventDate.qualifyingPeriodCloseAt,
                        competitionStartAt: ocmEventDate.competitionStartAt,
                        competitionCloseAt: ocmEventDate.competitionCloseAt,
                        competitionEndAt: ocmEventDate.competitionEndAt,
                        lengthOfPeriod: ocmEventDate.lengthOfPeriod,
                        lengthOfInterval: ocmEventDate.lengthOfInterval,
                        area: ocmEventDate.area,
                        minigamePatternId: ocmEventDate.minigamePatternId,
                    });
                }

                if (pastEvent === 1) {
                    console.log("Previous OCM Event Available");
                    lastCompetitionId = ocmEventDate.competitionId;
                }
            }

            // --- VSORG (Ghost Expedition) Event Check ---
            let ghostExpeditionDate = await prisma.ghostExpeditionEvent.findFirst({
                where: {
                    startAt: { lte: date },
                    aftereventEndAt: { gte: date },
                },
            });

            let expeditionSchedule: wm.wm5.protobuf.IGhostExpeditionSchedule | null = null;

            if (ghostExpeditionDate) {
                console.log("VSORG Expedition Event Available");

                expeditionSchedule = wm.wm5.protobuf.GhostExpeditionSchedule.create({
                    ghostExpeditionId: ghostExpeditionDate.ghostExpeditionId,
                    startAt: ghostExpeditionDate.startAt,
                    endAt: ghostExpeditionDate.endAt,
                    aftereventEndAt: ghostExpeditionDate.aftereventEndAt,
                    opponentCountry: ghostExpeditionDate.opponentCountry,
                });
            }

            // Response data
            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                regionId: body.allnetRegion0,
                placeId: body.regionName0,

                teamSuspensionAnnouncementStartAt: 2147483647,
                teamSuspensionStartAt: 2147483647,
                sendingReportPermitted: false,

                featureVersion: {
                    version: 9,
                    year: 2021,
                    month: 7,
                    pluses: 0,
                    releaseAt: 0,
                },

                // OCM
                latestCompetitionId: lastCompetitionId || null,
                competitionSchedule: competitionSchedule,

                // VSORG
                expeditionSchedule: expeditionSchedule,

                // Banapassport / scratch
                bnidServerAvailable: true,
                banacoinAvailable: true,
                banacoinAffiliatedPlace: true,
                scratchAvailable: true,
                displayOfScratchTerms: true,
                scratchNotes: 'Scratch Scratch Meow Meow',
                scratchTerms: 'Scratch',
            };

            // Encode the response
            let message = wm.wm5.protobuf.RegisterSystemInfoResponse.encode(msg);

            // Send the response to the client
            common.sendResponse(message, res);
        });


        // Ping
        app.post('/method/ping', (req, res) => {

            let body = wm.wm5.protobuf.PingRequest.decode(req.body);

            // Response data
            let ping = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                pong: body.ping || 1,
                bnidServerAvailable: true,
                banacoinAvailable: true,
            };

            // Encode the response
            let message = wm.wm5.protobuf.PingResponse.encode(ping);

            // Send the response to the client
            common.sendResponse(message, res);
        });


        // Register System Stats
        app.post('/method/register_system_stats', async (req, res) => {

            let body = wm.wm5.protobuf.RegisterSystemStatsRequest.decode(req.body);

            // Response data
            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
            };

            // Encode the response
            let message = wm.wm5.protobuf.RegisterSystemStatsResponse.encode(msg);

            // Send the response to the client
            common.sendResponse(message, res);
        });


        // Ask Access Code
        app.post('/method/ask_access_code', async (req, res) => {

            let body = wm.wm5.protobuf.AskAccessCodeRequest.decode(req.body);

            // Response data
            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                accessCode: '278313042069',
            };

            // Encode the response
            let message = wm.wm5.protobuf.AskAccessCodeResponse.encode(msg);

            // Send the response to the client
            common.sendResponse(message, res);
        });
    }
}