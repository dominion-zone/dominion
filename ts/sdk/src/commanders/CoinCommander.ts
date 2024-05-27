/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TransactionBlock,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from '../sdk';
import {Commander} from '../Commander';
import {Command} from '../command';

export type CoinCommandAction = TransferCoinAction;
export type TransferCoinAction = {
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
    sdk: DominionSDK,
    id: string,
    commanderType: string,
    dominionId: string,
    executionError: string | null,
    isExecuted: boolean,
    public readonly action: CoinCommandAction
  ) {
    super(sdk, id, commanderType, dominionId, executionError, isExecuted);
  }

  async withExecute({
    txb,
    executor,
  }: {
    txb: TransactionBlock;
    executor: TransactionObjectInput;
  }): Promise<TransactionObjectInput> {
    switch (this.action.type) {
      case 'transferCoin': {
        const {data: coins} = await this.sdk.sui.getCoins({
          owner: this.dominionId,
          coinType: this.action.coinType,
        });
        const total = coins.reduce(
          (acc, {balance}) => acc + BigInt(balance),
          BigInt(0)
        );
        if (total < this.action.amount) {
          throw new Error(
            `Not enough balance: ${total} < ${this.action.amount}`
          );
        }
        for (let i = 1; i < coins.length; i++) {
          CoinCommander.withJoinCoins({
            sdk: this.sdk,
            txb,
            coinType: this.action.coinType,
            dominion: txb.object(this.dominionId),
            source: {
              digest: coins[i].digest,
              objectId: coins[i].coinObjectId,
              version: coins[i].version,
            },
            target: {
              digest: coins[0].digest,
              objectId: coins[0].coinObjectId,
              version: coins[0].version,
            },
          });
        }
        return txb.moveCall({
          target: `${this.sdk.config.frameworkCommander.contract}::coin_commander::execute_transfer`,
          typeArguments: [this.action.coinType],
          arguments: [
            txb.object(executor),
            txb.object(this.dominionId),
            txb.receivingRef({
              digest: coins[0].digest,
              objectId: coins[0].coinObjectId,
              version: coins[0].version,
            }),
          ],
        });
      }
      default:
        throw new Error('Unknown command type');
    }
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
      sdk,
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

  static withDeposit({
    sdk,
    txb,
    coinType,
    dominion,
    source,
    target,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    coinType: string;
    dominion: TransactionObjectInput;
    source: TransactionObjectInput;
    target: {
      digest: string;
      objectId: string;
      version: string | number | bigint;
    };
  }) {
    txb.moveCall({
      target: `${sdk.config.frameworkCommander.contract}::coin_commander::deposit`,
      typeArguments: [coinType],
      arguments: [
        txb.object(dominion),
        txb.receivingRef(target),
        txb.object(source),
      ],
    });
  }

  static withJoinCoins({
    sdk,
    txb,
    coinType,
    dominion,
    source,
    target,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    coinType: string;
    dominion: TransactionObjectInput;
    source: {
      digest: string;
      objectId: string;
      version: string | number | bigint;
    };
    target: {
      digest: string;
      objectId: string;
      version: string | number | bigint;
    };
  }) {
    txb.moveCall({
      target: `${sdk.config.frameworkCommander.contract}::coin_commander::join_coins`,
      typeArguments: [coinType],
      arguments: [
        txb.object(dominion),
        txb.receivingRef(target),
        txb.receivingRef(source),
      ],
    });
  }
}
