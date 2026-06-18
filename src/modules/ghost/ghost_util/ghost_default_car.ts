import { Config } from "../../../config";

export async function DefaultGhostCarHonda() {
    let date = Math.floor(new Date().getTime() / 1000);
    return {
        cars: {
            carId: 999999999,
            name: 'Ｓ６６０',
            regionId: 1,
            manufacturer: 12, // HONDA
            model: 105, // S660 [JW5]
            visualModel: 130, // S660 [JW5]
            defaultColor: 0,
            customColor: 0,
            wheel: 20,
            wheelColor: 0,
            aero: 0,
            bonnet: 0,
            wing: 0,
            mirror: 0,
            sticker: 0,
            stickerColor: 0,
            sideSticker: 0,
            sideStickerColor: 0,
            roofSticker: 0,
            roofStickerColor: 0,
            specialSticker: 0,
            specialStickerColor: 0,
            neon: 0,
            trunk: 0,
            plate: 0,
            plateColor: 0,
            plateNumber: 0,
            tunePower: 24,
            tuneHandling: 24,
            rivalMarker: 32,
            aura: 551,
            title: 'Default Ghost',
            level: 65,
            lastPlayedAt: date,
            country: 'JPN',
            rgCharacterEffect: 0
        }
    };
}

export async function DefaultGhostCarBMW() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarChevrolet() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarMazda() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarMercedes() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarMitsubishi() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarNissan() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarSubaru() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarToyota() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarAudi() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarDodge() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarLamborghini() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarAcura() { return await DefaultGhostCarHonda(); }
export async function DefaultGhostCarPorsche() { return await DefaultGhostCarHonda(); }
