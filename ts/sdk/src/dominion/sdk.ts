import { SuiClient } from "@mysten/sui.js/client";


export class DominionSDK {
    private constructor(
        public readonly sui: SuiClient,
        public readonly contractAddress: string,
        public readonly adminControlAddress: string,
    ) {

    }

    static create({sui, contractAddress, adminControlAddress}: {sui: SuiClient, contractAddress: string, adminControlAddress: string}): DominionSDK {
        return new DominionSDK(sui, contractAddress, adminControlAddress);
    }
}