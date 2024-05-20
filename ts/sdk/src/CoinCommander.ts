/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TransactionBlock,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';
import {Commander} from './Commander';
import {Command} from './command';

export type CoinCommandAction = {
  type: 'transferCoin';
  coinType: string;
  recipient: string;
  amount: bigint;
};

type CoinCommandData = {
  objectId: string;
  content: {
    fields: {
      kind: number;
    };
    type: string;
  };
};

export class CoinCommand extends Command {
  public constructor(
    id: string,
    commanderType: string,
    dominionId: string,
    executionError: string | null,
    isExecuted: boolean,
    public readonly action: CoinCommandAction
  ) {
    super(id, commanderType, dominionId, executionError, isExecuted);
  }
}

export class CoinCommander implements Commander {
  constructor(public contractId: string) {}
  get name() {
    return 'coin';
  }
  get commanderType() {
    return `${this.contractId}::coin_commander::CoinCommander`;
  }

  withEnable({
    sdk,
    txb,
    dominion,
    adminCap,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
    adminCap: TransactionObjectInput;
  }) {
    txb.moveCall({
      target: `${sdk.config.frameworkCommander.contract}::coin_commander::enable`,
      arguments: [txb.object(dominion), txb.object(adminCap)],
    });
  }

  withDisable({
    sdk,
    txb,
    dominion,
    adminCap,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
    adminCap: TransactionObjectInput;
  }) {
    txb.moveCall({
      target: `${sdk.config.frameworkCommander.contract}::coin_commander::disable`,
      arguments: [txb.object(dominion), txb.object(adminCap)],
    });
  }

  async parseCommand({
    sdk,
    id,
    dominionId,
    executionError,
    isExecuted,
  }: {
    sdk: DominionSDK;
    id: string;
    dominionId: string;
    executionError: string | null;
    isExecuted: boolean;
  }) {
    const commandObject = await sdk.sui.getDynamicFieldObject({
      parentId: id,
      name: {type: 'u8', value: 1},
    });
    const payload = commandObject.data as unknown as CoinCommandData;
    const coinType = payload.content.type.match(
      /.+::coin_commander::CoinCommand<(.+)>/
    )![1];

    let action: CoinCommandAction;
    switch (payload.content.fields.kind) {
      case 0: {
        const {data: recipient} = await sdk.sui.getDynamicFieldObject({
          parentId: payload.objectId,
          name: {type: 'u8', value: 0},
        })!;
        const {data: amount} = await sdk.sui.getDynamicFieldObject({
          parentId: payload.objectId,
          name: {type: 'u8', value: 1},
        });

        action = {
          type: 'transferCoin',
          coinType,
          recipient: (recipient as any).content.fields.value,
          // eslint-disable-next-line node/no-unsupported-features/es-builtins
          amount: BigInt((amount as any).content.fields.value),
        };
        break;
      }
      default:
        throw new Error(`Unknown command kind: ${payload.content.fields.kind}`);
    }

    return new CoinCommand(
      id,
      this.commanderType,
      dominionId,
      executionError,
      isExecuted,
      action
    );
  }

  withCreateCommand({
    sdk,
    txb,
    dominion,
    action,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
    action: CoinCommandAction;
  }): TransactionResult {
    switch (action.type) {
      case 'transferCoin': {
        return txb.moveCall({
          target: `${sdk.config.frameworkCommander.contract}::coin_commander::new_transfer_command`,
          arguments: [
            txb.object(dominion),
            txb.pure(action.recipient),
            txb.pure(action.amount),
          ],
          typeArguments: [action.coinType],
        });
      }
    }
  }
}
