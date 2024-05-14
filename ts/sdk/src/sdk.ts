import {SuiClient} from '@mysten/sui.js/client';

export type Config = {
  dominion: {
    contract: string;
  };
  governance: {
    contract: string;
  };
  registry: {
    contract: string;
  };
};

export class DominionSDK {
  public constructor(
    public readonly sui: SuiClient,
    public readonly config: Config
  ) {}
}
