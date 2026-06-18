import { prisma } from "../..";

// Import Proto
import * as wm from "../../wmmt/wm5.proto";


// Save OCM ghost battle result
export async function saveOCMGhostTrail(body: wm.wm5.protobuf.RegisterGhostTrailRequest)
{
    console.log('Checking OCM Ghost Battle trail history');

    // Get current date
    let date = Math.floor(new Date().getTime() / 1000);

    // Get current active OCM Event
    let ocmEventDate = await prisma.oCMEvent.findFirst({
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        },
        orderBy:{
            competitionId: 'desc'
        }
    });

    if(ocmEventDate)
    {
        // Get OCM Period ID
        let OCM_periodId = await prisma.oCMPeriod.findFirst({ 
            where:{
                competitionDbId: ocmEventDate.dbId,
                competitionId: ocmEventDate.competitionId,

                // StartAt is less than current date
                startAt: { lte: date },

                // CloseAt is greater than current date
                closeAt: { gte: date }
            },
            select:{
                periodId: true
            }
        });

        let ocmMainDraws: boolean = false;
        let periodId = 0;

        // Current date is OCM main draw
        if(ocmEventDate!.competitionStartAt < date && ocmEventDate!.competitionCloseAt > date)
        {
            periodId = OCM_periodId!.periodId;
            ocmMainDraws = true;
        }
        // Current date is OCM qualifying day
		else if(ocmEventDate!.qualifyingPeriodStartAt < date && ocmEventDate!.qualifyingPeriodCloseAt > date)
        { 
            ocmMainDraws = false;
        }

        // Get the ghost result for the car
        let ghostResult = body?.ghost;

        // Declare data
        let data : any;

        // ghostResult is set
        if (ghostResult)
        {
            // Ghost update data
            let grArea: number = 0;
            let grRamp: number = 0;
            let grPath: number = 0;

            if(ghostResult.area)
            {
                grArea = ghostResult.area;
            }
            if(ghostResult.ramp)
            {
                grRamp = ghostResult.ramp;
            }
            if(0 /* path not in IGhostCar */)
            {
                grPath = 0 /* path not in IGhostCar */;
            }

            data = {
                carId: Number(ghostResult.car.carId),
                area: grArea, 
                ramp: grRamp, 
                path: grPath, 
                trail: body.trail || undefined,
                competitionId: ocmEventDate!.competitionId,
                periodId: periodId,
                playedAt: ghostResult.car.lastPlayedAt || undefined,
                tunePower: ghostResult.car.tunePower || undefined,
                tuneHandling: ghostResult.car.tuneHandling || undefined,
                ocmMainDraw: ocmMainDraws
            }

            // Check OCM Ghost Battle Record if playing OCM Ghost Battle Mode
            let gtCount = await prisma.oCMGhostTrail.findFirst({
                where:{
                    carId: ghostResult.car.carId!,
                    competitionId: ocmEventDate!.competitionId,
                    area: grArea,
                    ramp: grRamp,
                    path: grPath,
                    periodId: periodId,
                    ocmMainDraw: ocmMainDraws
                },
                orderBy: {
                    playedAt: 'desc'
                }
            });

            // Record exist, update it
            if(gtCount)
            {
                console.log('OCM Ghost Trail history found');
                console.log('Updating OCM ghost trail to the newest trail');

                // Update the data
                await prisma.oCMGhostTrail.update({
                    where: {
                        dbId: gtCount.dbId
                    },
                    data: data
                });
            }
            // Record does not exist, create new
            else
            {
                console.log('No OCM ghost trail history');
                console.log('Creating new OCM ghost trail entry');

                // Create new data
                await prisma.oCMGhostTrail.create({
                    data: data
                });
            }
        }
    }
}


// Save Crown ghost battle result
export async function saveCrownGhostTrail(body: wm.wm5.protobuf.RegisterGhostTrailRequest)
{
    console.log('Checking Crown Ghost Battle trail history');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // Declare data
    let data : any;

    // ghostResult is set
    if (ghostResult)
    {
        // Ghost update data
        let grArea: number = 0;
        let grRamp: number = 0;
        let grPath: number = 0;
        
        if(ghostResult.area)
        {
            grArea = ghostResult.area;
        }
        if(ghostResult.ramp)
        {
            grRamp = ghostResult.ramp;
        }
        if(0 /* path not in IGhostCar */)
        {
            grPath = 0 /* path not in IGhostCar */;
        }
        
        data = {
            carId: Number(ghostResult.car.carId),
            area: grArea, 
            ramp: grRamp, 
            path: grPath, 
            trail: body.trail || undefined,
            playedAt: ghostResult.car.lastPlayedAt || undefined,
            tunePower: ghostResult.car.tunePower || undefined,
            tuneHandling: ghostResult.car.tuneHandling || undefined,
            crownBattle: true,
        }

        // Check Crown Ghost Battle Record if playing Crown Ghost Battle Mode
        let gtCount = await prisma.ghostTrail.findFirst({
            where:{
                carId: ghostResult.car.carId!,
                area: grArea,
                ramp: grRamp,
                path: grPath,
                crownBattle: true,
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        // Record exist, update it
        if(gtCount)
        {
            console.log('Crown Trail history found');
            console.log('Updating crown trail to the newest trail');

            // Update the data
            await prisma.ghostTrail.update({
                where: {
                    dbId: gtCount.dbId
                },
                data: data
            });
        }
        // Record does not exist, create new
        else
        {
            console.log('No crown trail history');
            console.log('Creating new crown trail entry');

            // Create new data
            await prisma.ghostTrail.create({
                data: data
            });
        }

        // Update crown randomized ramp and path to the correct value
        console.log('Updating crown\'s area records to the correct value')
        await prisma.carCrown.upsert({
            where: {
                area: ghostResult.area!
            },
            update: {
                carId: ghostResult.car.carId!,
                ramp: ghostResult.ramp!,
                path: 0 /* path not in IGhostCar */!,
                playedAt: ghostResult.car.lastPlayedAt!,
                tunePower: ghostResult.car.tunePower!,
                tuneHandling: ghostResult.car.tuneHandling!
            },
            create: {
                carId: ghostResult.car.carId!,
                area: ghostResult.area!,
                ramp: ghostResult.ramp!,
                path: 0 /* path not in IGhostCar */!,
                playedAt: ghostResult.car.lastPlayedAt!,
                tunePower: ghostResult.car.tunePower!,
                tuneHandling: ghostResult.car.tuneHandling!
            }
        });
    }
}

// Save Crown ghost battle result
export async function saveNormalGhostTrail(body: wm.wm5.protobuf.RegisterGhostTrailRequest)
{
    console.log('Checking Normal Ghost Battle trail history');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // Declare data
    let data : any;

    // ghostResult is set
    if (ghostResult)
    {
        // Ghost update data
        let grArea: number = 0;
        let grRamp: number = 0;
        let grPath: number = 0;
        if(ghostResult.area)
        {
            grArea = ghostResult.area;
        }
        if(ghostResult.ramp)
        {
            grRamp = ghostResult.ramp;
        }
        if(0 /* path not in IGhostCar */)
        {
            grPath = 0 /* path not in IGhostCar */;
        }
        
        data = {
            carId: Number(ghostResult.car.carId),
            area: grArea, 
            ramp: grRamp, 
            path: grPath, 
            trail: body.trail || undefined,
            playedAt: ghostResult.car.lastPlayedAt || undefined,
            tunePower: ghostResult.car.tunePower || undefined,
            tuneHandling: ghostResult.car.tuneHandling || undefined,
            crownBattle: false,
        }

        // Check Normal Ghost Battle Record
        let gtCount = await prisma.ghostTrail.findFirst({
            where:{
                carId: ghostResult.car.carId!,
                area: grArea,
                ramp: grRamp,
                path: grPath,
                crownBattle: false,
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        // Record exist, update it
        if(gtCount)
        {
            console.log('Trail history found');
            console.log('Updating trail to the newest trail');

            // Update the data
            await prisma.ghostTrail.update({
                where: {
                    dbId: gtCount.dbId
                },
                data: data
            });
        }
        // Record does not exist, create new
        else
        {
            console.log('No trail history');
            console.log('Creating new trail entry');

            // Create new data
            await prisma.ghostTrail.create({
                data: data
            });
        }
    }
}


// Save path and tuning  result
export async function savePathAndTuning(body: wm.wm5.protobuf.RegisterGhostTrailRequest)
{
    console.log('Saving Car Path and Tuning');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // ghostResult is set
    if (ghostResult)
    {
        let grArea: number = ghostResult.area || 0;
        let grRamp: number = ghostResult.ramp || 0;
        let grPath: number = 0; // Path is not in IGhostCar yet

        //Check Car Path and Tuning Record for certain area
        let cPaT_count = await prisma.carPathandTuning.findFirst({
            where:{
                carId: ghostResult.car.carId!,
                area: grArea,
                ramp: grRamp,
                path: grPath,
            },
            orderBy: {
                lastPlayedAt: 'desc'
            }
        });

        // Record (Car Path and Tuning) exist, update it
        if(cPaT_count)
        {
            console.log('Updating path and tuning record');

            await prisma.carPathandTuning.update({
                where: {
                    dbId: cPaT_count.dbId
                },
                data:{
                    carId: ghostResult.car.carId!,
                    area: grArea,
                    ramp: grRamp,
                    path: grPath,
                    tunePower: ghostResult.car.tunePower!,
                    tuneHandling: ghostResult.car.tuneHandling!,
                    lastPlayedAt: ghostResult.car.lastPlayedAt!
                }
            });
        }
        // Record (Car Path and Tuning) does not exist, create new
        else
        {
            console.log('Creating new path and tuning record');

            await prisma.carPathandTuning.create({
                data: {
                    carId: ghostResult.car.carId!,
                    area: grArea,
                    ramp: grRamp,
                    path: grPath,
                    tunePower: ghostResult.car.tunePower!,
                    tuneHandling: ghostResult.car.tuneHandling!,
                    lastPlayedAt: ghostResult.car.lastPlayedAt!
                }
            });
        }
    }
}