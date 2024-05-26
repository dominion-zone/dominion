import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

export type CommandData = {
  type: string;
  fields: {
    commander: {type: '0x1::type_name::TypeName'; fields: {name: string}};
    dominion_id: string;
    execution_error: string | null;
    id: {id: string};
    is_executed: boolean;
  };
};

export abstract class Command {
  public constructor(
    public readonly sdk: DominionSDK,
    public readonly id: string,
    public readonly commanderType: string,
    public readonly dominionId: string,
    public readonly executionError: string | null,
    public readonly isExecuted: boolean
  ) {}

  abstract get action(): object;

  abstract withExecute({
    txb,
    executor,
  }: {
    txb: TransactionBlock;
    executor: TransactionObjectInput;
  }): Promise<TransactionObjectInput>;

  static fromData({
    sdk,
    data: {
      fields: {
        commander,
        dominion_id,
        execution_error,
        is_executed,
        id: {id},
      },
    },
  }: {
    sdk: DominionSDK;
    data: CommandData;
  }) {
    const c = sdk.commanderByType.get('0x' + commander.fields.name);
    if (!c) {
      throw new Error(`Commander not found: 0x${commander.fields.name}`);
    }
    return c.parseCommand({
      sdk,
      id,
      dominionId: dominion_id,
      executionError: execution_error,
      isExecuted: is_executed,
    });
  }
}
