import {
  TransactionBlock,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {Command} from './command';
import {DominionSDK} from './sdk';

export interface Commander {
  name: string;
  contractId: string;
  commanderType: string;

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
  }): void;

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
  }): void;

  parseCommand({
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
  }): Promise<Command>;

  withCreateCommand({
    sdk,
    txb,
    dominion,
    action,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
    action: object;
  }): TransactionResult;
}
