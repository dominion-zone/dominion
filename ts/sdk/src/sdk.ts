import {SuiClient} from '@mysten/sui.js/client';
import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';

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
  public constructor(
    public readonly sui: SuiClient,
    public readonly config: Config
  ) {}

  public withEnableCoinCommander({
    txb,
    dominion,
    adminCap,
  }: {
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
    adminCap: TransactionObjectInput;
  }) {
    txb.moveCall({
      target: `${this.config.frameworkCommander.contract}::coin_commander::enable`,
      arguments: [txb.object(dominion), txb.object(adminCap)],
    });
  }
}
