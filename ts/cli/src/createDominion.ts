import {Command} from 'commander';
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {getContext} from './context';
import {Dominion} from '@dominion.zone/dominion-sdk';

export const installCreateDominion = (program: Command) => {
  program.command('create-dominion').action(createDominionAction);
};

const createDominionAction = async () => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK} = getContext();
  Dominion.withCreateSelfControlledDominion(dominionSDK, txb);
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet.getPublicKey().toSuiAddress());
  const r = await dominionSDK.sui.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: txb,
  });
  console.log(r.digest);
};
