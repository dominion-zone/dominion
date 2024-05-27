import {SuiClient} from '@mysten/sui.js/client';
import {Commander} from './Commander';
import {CoinCommander} from './commanders/CoinCommander';

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
  frameworkCommander: {
    contract: string;
  };
};

export class DominionSDK {
  public readonly commanderByType: Map<string, Commander> = new Map();

  public readonly coinCommander: CoinCommander;

  public constructor(
    public readonly sui: SuiClient,
    public readonly config: Config
  ) {
    this.coinCommander = new CoinCommander(config.frameworkCommander.contract);
    this.commanderByType.set(
      this.coinCommander.commanderType,
      this.coinCommander
    );
  }
}
