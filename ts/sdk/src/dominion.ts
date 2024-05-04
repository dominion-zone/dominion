import {
  TransactionBlock,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

export class Dominion {
  public static withNewSelfControlledDominion(
    sdk: DominionSDK,
    txb: TransactionBlock
  ): TransactionResult {
    return txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion_admin_commander::new_self_controlled_dominion`,
      arguments: [txb.object(sdk.config.dominion.adminControl)],
    });
  }

  public static withCreateSelfControlledDominion(
    sdk: DominionSDK,
    txb: TransactionBlock
  ) {
    txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion_admin_commander::create_self_controlled_dominion`,
      arguments: [txb.object(sdk.config.dominion.adminControl)],
    });
  }

  public static withCommit({
    sdk,
    dominion,
    txb,
  }: {
    sdk: DominionSDK;
    dominion: TransactionObjectInput;
    txb: TransactionBlock;
  }): TransactionResult {
    return txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion::commit`,
      arguments: [txb.object(dominion)],
    });
  }
}
