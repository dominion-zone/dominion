import {Command} from 'commander';
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {getContext} from './context';
import {Dominion} from '@dominion.zone/dominion-sdk';

export const installCreateSelfControlledDominion = (program: Command) => {
  program
    .command('create-self-controlled-dominion')
    .action(createSelfControlledDominionAction);
};

const createSelfControlledDominionAction = async () => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK} = getContext();
  Dominion.createSelfControlledDominion(dominionSDK, txb);
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet.getPublicKey().toSuiAddress());
  let r = await dominionSDK.sui.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: txb,
  });
  console.log(r.digest);
};
