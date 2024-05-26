/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {Command} from 'commander';
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {getContext} from './context';
import {
  Dominion,
  Governance,
  Proposal,
  Registry,
} from '@dominion.zone/dominion-sdk';
import {SUI_CLOCK_OBJECT_ID} from '@mysten/sui.js/utils';

export const installCrank = (program: Command) => {
  program.command('crank').action(crankAction);
};

const crankAction = async () => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK, appConfig, env} = getContext();
  const clock = await dominionSDK.sui.getObject({
    id: SUI_CLOCK_OBJECT_ID,
    options: {showContent: true},
  });
  const currentTime = BigInt((clock.data?.content as any).fields.timestamp_ms);

  const registry = await Registry.fetch({
    sdk: dominionSDK,
    id: appConfig[env].registry.main!,
  });
  const dominions = await Dominion.multiFetch({
    sdk: dominionSDK,
    ids: registry.entries.map(({dominionId}) => dominionId),
  });
  const governances = await Governance.multiFetch({
    sdk: dominionSDK,
    ids: dominions.map(({ownerAddress}) => ownerAddress),
  });
  let hasActions = false;
  for (let i = 0; i < dominions.length; i++) {
    console.log(`Processing dominion ${dominions[i].id}`);
    const proposals = await Proposal.multiFetch({
      sdk: dominionSDK,
      ids: governances[i].proposalIds,
    });
    let executing = false;
    for (const proposal of proposals) {
      const status = proposal.status(currentTime);
      switch (status) {
        case 'finalizationRequired': {
          console.log(`Finalizing proposal ${proposal.id}`);
          hasActions = true;
          Proposal.withFinalizeProposal({
            sdk: dominionSDK,
            proposal: proposal.id,
            coinType: governances[i].coinType,
            txb,
          });
          break;
        }
        case 'executing': {
          // Executing max one command per tx
          if (executing) {
            console.log(`Ignoring execution of proposal ${proposal.id}`);
            continue;
          }
          const option = proposal.resultOption()!;
          console.log(
            `Executing proposal ${proposal.id} comand #${option.executedCommandCount}`
          );
          const {executor, proposalExecutor} = proposal.withExecuteNextCommand({
            dominion: txb.object(dominions[i].id),
            txb,
          });
          option.commands[option.executedCommandCount];
          const command = await option.commands[
            option.executedCommandCount
          ].withExecute({
            txb,
            executor: txb.object(executor),
          });
          proposal.withCommitCommandExecution({
            txb,
            command,
            proposalExecutor: txb.object(proposalExecutor),
          });
          executing = true;
          hasActions = true;
          break;
        }
        default: {
          console.log(`Skipping proposal ${proposal.id} in ${status} state`);
          break;
        }
      }
    }
  }

  if (!hasActions) {
    console.log('Nothing to do');
    return;
  }
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet.getPublicKey().toSuiAddress());
  // console.log(txb.serialize());
  const r = await dominionSDK.sui.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: txb,
  });
  console.log(r.digest);
};
