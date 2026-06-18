import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/wm5.proto";

// Import Util
import * as common from "./util/common";
import { shopItems } from "./util/shop_items";


export default class ShopModule extends Module {
    register(app: Application): void {

		        // Load Shop Information
				app.post('/method/load_shop_information', async (req, res) => {

					// Get the request body for the load drive information request
					let body = wm.wm5.protobuf.LoadShopInformationRequest.decode(req.body);

					// Get car shop data
					let car = await prisma.car.findFirst({
						where: {
							carId: body.carId
						},
						select: {
							shopGrade: true,
							shopPoint: true
						}
					});

					let currentShopGrade = car?.shopGrade || 0;

					// Create shop item proto
					let items: wm.wm5.protobuf.LoadShopInformationResponse.ShopItem[] = [];

					// Filter items based on shopGrade (Show items that are unlocked or near unlock)
					for (let itemData of shopItems) {
						// Logic: Show items if shopGrade is reached, or show locked items if close to the grade
						// For now, let's show all items but the game client will handle the "Locked" UI based on shopGrade
						items.push(wm.wm5.protobuf.LoadShopInformationResponse.ShopItem.create({
							category: itemData.category,
							itemId: itemData.itemId,
							price: itemData.price,
							shopGrade: itemData.shopGrade,
							recommended: itemData.recommended,
							isNew: itemData.isNew
						}));
					}

					// Response data
		            let msg = {
						error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
						items: items,
						shopGrade: currentShopGrade,
						shopPoint: car?.shopPoint || 0,
						shopState: wm.wm5.protobuf.ShopState.SHOP_NEW_ARRIVALS,
						noticeUnlocked: true,
						shopEnabled: true
					}

					// Encode the response
					let message = wm.wm5.protobuf.LoadShopInformationResponse.encode(msg);
				
					// Send the response to the client
					common.sendResponse(message, res);
				})

				// Buy Shop Item
				app.post('/method/buy_shop_item', async (req, res) => {
					try {
						// Use any to bypass missing type in proto
						let body = (wm.wm5.protobuf as any).BuyShopItemRequest.decode(req.body);
						
						// Get car data
						let car = await prisma.car.findFirst({
							where: { carId: body.carId }
						});

						if (!car) throw new Error("Car not found");

						// Find item in our shop catalog
						let itemData = shopItems.find(i => i.category === body.category && i.itemId === body.itemId);
						
						if (!itemData) {
							console.error(`Item not found in shop catalog: Cat ${body.category}, ID ${body.itemId}`);
							// Return success anyway to not crash the game
							common.sendResponse((wm.wm5.protobuf as any).BuyShopItemResponse.encode({
								error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS 
							}).finish(), res);
							return;
						}

						// Check if enough points and grade
						if (car.shopPoint < itemData.price || car.shopGrade < itemData.shopGrade) {
							console.log(`Purchase failed: Points ${car.shopPoint}/${itemData.price}, Grade ${car.shopGrade}/${itemData.shopGrade}`);
						} else {
							// Deduct points and add item
							await prisma.$transaction([
								prisma.car.update({
									where: { carId: body.carId },
									data: { shopPoint: { decrement: itemData.price } }
								}),
								prisma.carItem.create({
									data: {
										carId: body.carId,
										category: body.category,
										itemId: body.itemId,
										amount: 1
									}
								})
							]);
							console.log(`Item purchased: Cat ${body.category}, ID ${body.itemId} for car ${body.carId}`);
						}

						let msg = {
							error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS
						};

						common.sendResponse((wm.wm5.protobuf as any).BuyShopItemResponse.encode(msg).finish(), res);
					} catch (e) {
						console.error('buy_shop_item error:', e);
						// If decode fails, it might be because the type is really missing.
						// In that case, we return a simple success to avoid blocking the game.
						res.status(200).send(Buffer.from([0x08, 0x00])); // ERR_SUCCESS in protobuf
					}
				})
    }
}