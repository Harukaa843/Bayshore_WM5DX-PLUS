import { Application } from "express";
import { Module } from "../module";
import { Config } from "../config";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/wm5.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";
import * as ranking from "./resource/ranking";


export default class ResourceModule extends Module {
    register(app: Application): void {

        // Place List
        app.get('/resource/place_list', async (req, res) => {
            console.log('place list');
            let places: wm.wm5.protobuf.Place[] = [];
            places.push(new wm.wm5.protobuf.Place({
                placeId: Config.getConfig().placeId || 'JPN0123',
                regionId: Number(Config.getConfig().regionId) || 1,
                shopName: Config.getConfig().shopName || 'Bayshore',
                country: Config.getConfig().country || 'JPN'
            }));

            let checkPlaceList = await prisma.placeList.findFirst({
                where:{ placeId: Config.getConfig().placeId }
            })

            if(!(checkPlaceList)) {
                await prisma.placeList.create({
                    data:{
                        placeId: Config.getConfig().placeId || 'JPN0123',
                        regionId: Number(Config.getConfig().regionId) || 1,
                        shopName: Config.getConfig().shopName || 'Bayshore',
                        country: Config.getConfig().country || 'JPN'
                    }
                })
            }
            let message = wm.wm5.protobuf.PlaceList.encode({places});
            common.sendResponse(message, res);
        })

        // Get Ranking data for attract screen (TA, Ghost, VS)
        app.get('/resource/ranking', async (req, res) => {
            console.log('ranking');
            let lists: wmsrv.wm5.protobuf.Ranking.List[] = [];
            let rankingTA = await ranking.getTimeAttackRanking();
            lists.push( ...rankingTA.lists );
            let rankingVSOutrun = await ranking.getVSOutrunRanking();
            lists.push( ...rankingVSOutrun.lists );
            let rankingGhostTrophies = await ranking.getGhostTrophiesRanking();
            lists.push( ...rankingGhostTrophies.lists );
            let message = wmsrv.wm5.protobuf.Ranking.encode({lists});
            common.sendResponse(message, res);
        })

        // File List
        app.get('/resource/file_list', async (req, res) => {
            console.log('file_list');
			let msg = { error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS, files: null, interval: null }
			let message = wm.wm5.protobuf.FileList.encode(msg);
            common.sendResponse(message, res);
		})

        // Ghost List
        app.get('/resource/ghost_list', async (req, res) => {
            console.log('ghost_list');
            let msg = { error: wmsrv.wm5.protobuf.ErrorCode.ERR_SUCCESS, ghosts: null };
            let message = wmsrv.wm5.protobuf.GhostList.encode(msg);
            common.sendResponse(message, res);
		})

        // Car Summary Count
        app.get('/resource/car_summary_count', async (req, res) => {
            try {
                console.log('car_summary_count: Feature currently disabled');
                res.sendStatus(404);
            } catch(e) {
                res.sendStatus(500);
            }
        })
    }
}
