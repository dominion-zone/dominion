import { TransactionBlock, TransactionResult } from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

export class Dominion {
    public static newSelfControlledDominion(sdk: DominionSDK, txb: TransactionBlock): TransactionResult {
        return txb.moveCall({
            target: `${sdk.contractAddress}::dominion_admin_commander::new_self_controlled_dominion`,
            arguments: [
                txb.object(sdk.adminControlAddress)
            ]
        })
    }

    public static createSelfControlledDominion(sdk: DominionSDK, txb: TransactionBlock) {
        txb.moveCall({
            target: `${sdk.contractAddress}::dominion_admin_commander::create_self_controlled_dominion`,
            arguments: [
                txb.object(sdk.adminControlAddress)
            ]
        })
    }
}