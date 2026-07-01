/**
 * Global state management for WMMT5 Server
 * This ensures that state is shared correctly across all modules
 */

export class ServerState {
    private static instance: ServerState;
    
    // 0 = Unknown, 1 = Ghost Level Mode, 2 = Crown Mode
    public lastRequestType: number = 0;

    private constructor() {}

    public static getInstance(): ServerState {
        if (!ServerState.instance) {
            ServerState.instance = new ServerState();
        }
        return ServerState.instance;
    }

    public setMode(mode: number) {
        this.lastRequestType = mode;
    }

    public getMode(): number {
        return this.lastRequestType;
    }
}

export const serverState = ServerState.getInstance();
