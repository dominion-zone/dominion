import { SuiClient } from "@mysten/sui.js/client";

export type Config = {
    dominion: {
      contract: string;
      adminControl: string;
    },
    governance: {
      contract: string;
      adminControl: string;
    }
}

export class DominionSDK {
    public constructor(
        public readonly sui: SuiClient,
        public readonly config: Config,
    ) {

    }
}