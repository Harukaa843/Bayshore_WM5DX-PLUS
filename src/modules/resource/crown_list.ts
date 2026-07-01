import { prisma } from "../..";

//Import Proto
import wmsrv from "../../wmmt/service.proto";


// Get Crown List
export async function getCrownList()
{
    // Empty list of crown records
    let list_crown: wmsrv.wm5.protobuf.Crown[] = [];

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get all crown holders from DB
    let car_crowns = await prisma.carCrown.findMany({
        orderBy: { area: 'asc' }
    });
    
    // Create a map for quick lookup by area
    const crownMap = new Map();
    car_crowns.forEach(c => crownMap.set(c.area, c));

    // WMMT5 Area List (0-13 are standard, 18 is Hiroshima)
    // We will generate a list that covers all possible areas to ensure they show up in game.
    const targetAreas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20, 21, 22, 23, 24, 25];

    for (const i of targetAreas) {
        const crownRecord = crownMap.get(i);

        if (crownRecord) {
            // Case: There is a real player holding the crown
            let car = await prisma.car.findFirst({
                where: { carId: crownRecord.carId },
                include: { gtWing: true, lastPlayedPlace: true }
            });

            if (car) {
                if (car.regionId === 0) car.regionId = i + 1;
                car.tunePower = crownRecord.tunePower;
                car.tuneHandling = crownRecord.tuneHandling;

                let playedAt = crownRecord.playedAt;
                if (playedAt === 0 || playedAt < 1657299600) {
                    playedAt = 1657299600;
                } else {
                    playedAt = playedAt - 172800;
                }
                car.lastPlayedAt = playedAt;

                list_crown.push(wmsrv.wm5.protobuf.Crown.create({  
                    carId: crownRecord.carId,
                    area: i,
                    unlockAt: playedAt,
                    car: car
                }));
                continue;
            }
        }

        // Case: No player holds the crown. 
        // We push a Default Crown with carId: 0. 
        // This is the most stable way to show a "Default Boss" in WMMT5.
        list_crown.push(wmsrv.wm5.protobuf.Crown.create({ 
            carId: 0, 
            area: i,
            unlockAt: 0,
        }));
    }

    return { list_crown }
}
