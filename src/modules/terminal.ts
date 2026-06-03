import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";
import { User } from "@prisma/client";

// Import Proto
import * as wm from "../wmmt/wm5.proto";

// Import Util
import * as common from "./util/common";


export default class TerminalModule extends Module {
    register(app: Application): void {

        // Load terminal information - called when player uses the terminal
        // Request uses userId (not carId) in WMMT5
        app.post('/method/load_terminal_information', async (req, res) => {
            try {
                let body = wm.wm5.protobuf.LoadTerminalInformationRequest.decode(req.body);

                // Look up user to check maxi gold receivable status
                let user = await prisma.user.findFirst({
                    where: { id: body.userId }
                });

                // Check if user has unclaimed maxi gold from terminal
                let maxiGoldReceivable = (user?.maxiGold ?? 0) > 0;

                let msg = {
                    error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                    maxiGoldReceivable: maxiGoldReceivable,
                    prizeReceivable: false,
                    noticeEntries: [],
                    noticeMessage: [],
                    noticeWindow: [],
                    noticeWindowMessage: [],
                    transferNotice: {
                        needToSeeTransferred: false,
                        needToRenameCar: false,
                        needToRenameTeam: false,
                    },
                    announceFeature: false,
                    freeScratched: user?.lastScratched === 0,
                };

                let message = wm.wm5.protobuf.LoadTerminalInformationResponse.encode(msg);
                common.sendResponse(message, res);
            } catch (e) {
                console.error('load_terminal_information error:', e);
                res.status(500).end();
            }
        });

        // Save terminal result - called when player exits the terminal
        app.post('/method/save_terminal_result', async (req, res) => {
            try {
                let body = wm.wm5.protobuf.SaveTerminalResultRequest.decode(req.body);

                // Update car order if provided
                if (body.carOrder && body.carOrder.length > 0) {
                    await prisma.user.update({
                        where: { id: body.userId },
                        data: { carOrder: body.carOrder }
                    });
                }

                let msg = {
                    error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                };

                let message = wm.wm5.protobuf.SaveTerminalResultResponse.encode(msg);
                common.sendResponse(message, res);
            } catch (e) {
                console.error('save_terminal_result error:', e);
                res.status(500).end();
            }
        });

        // Load scratch information - called when player enters the scratch menu
        app.post('/method/load_scratch_information', async (req, res) => {
            try {
                let body = wm.wm5.protobuf.LoadScratchInformationRequest.decode(req.body);

                let user = await prisma.user.findFirst({
                    where: { id: body.userId },
                    include: {
                        ScratchSheet: {
                            include: {
                                squares: true
                            }
                        },
                        items: true
                    }
                });

                if (!user) {
                    res.status(404).end();
                    return;
                }

                let msg = {
                    error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                    scratchSheets: user.ScratchSheet.map(sheet => ({
                        squares: sheet.squares.map(square => ({
                            category: square.category,
                            itemId: square.itemId,
                            earned: square.earned
                        }))
                    })),
                    currentSheet: user.currentSheet,
                    numOfScratched: user.lastScratched,
                    ownedUserItems: user.items.map(item => ({
                        category: item.category,
                        itemId: item.itemId,
                        type: item.type,
                        earnedAt: item.earnedAt
                    })),
                    banacoinsRemain: 999999
                };

                let message = wm.wm5.protobuf.LoadScratchInformationResponse.encode(msg);
                common.sendResponse(message, res);
            } catch (e) {
                console.error('load_scratch_information error:', e);
                res.status(500).end();
            }
        });

        // Save scratch sheet - called when player scratches a square
        app.post('/method/save_scratch_sheet', async (req, res) => {
            try {
                let body = wm.wm5.protobuf.SaveScratchSheetRequest.decode(req.body);

                // Find user and their current scratch sheet
                let user = await prisma.user.findFirst({
                    where: { id: body.userId },
                    include: {
                        ScratchSheet: {
                            where: { sheetNo: body.targetSheet },
                            include: { squares: true }
                        }
                    }
                });

                if (!user || user.ScratchSheet.length === 0) {
                    res.status(404).end();
                    return;
                }

                let sheet = user.ScratchSheet[0];
                let squareIndex = body.targetSquare;
                
                // Validate square index
                if (squareIndex < 0 || squareIndex >= sheet.squares.length) {
                    res.status(400).end();
                    return;
                }

                let square = sheet.squares[squareIndex];

                // Update square as earned
                await prisma.scratchSquare.update({
                    where: { id: square.id },
                    data: { earned: true }
                });

                // Add item to user's inventory
                await prisma.userItem.create({
                    data: {
                        userId: user.id,
                        category: square.category,
                        itemId: square.itemId,
                        earnedAt: Math.floor(Date.now() / 1000)
                    }
                });

                // Update user's last scratched timestamp/count
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastScratched: { increment: 1 } }
                });

                // Refresh user data for response
                let updatedUser = await prisma.user.findFirst({
                    where: { id: body.userId },
                    include: {
                        ScratchSheet: {
                            include: { squares: true }
                        }
                    }
                });

                let msg = {
                    error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                    scratchSheets: updatedUser!.ScratchSheet.map(s => ({
                        squares: s.squares.map(sq => ({
                            category: sq.category,
                            itemId: sq.itemId,
                            earned: sq.earned
                        }))
                    })),
                    currentSheet: updatedUser!.currentSheet,
                    numOfScratched: updatedUser!.lastScratched,
                    earnedItem: {
                        category: square.category,
                        itemId: square.itemId,
                        earned: true
                    },
                    banacoinError: wm.wm5.protobuf.BanacoinErrorCode.BC_SUCCESS,
                    banacoinsRemain: 999999
                };

                let message = wm.wm5.protobuf.SaveScratchSheetResponse.encode(msg);
                common.sendResponse(message, res);
            } catch (e) {
                console.error('save_scratch_sheet error:', e);
                res.status(500).end();
            }
        });
    }
}