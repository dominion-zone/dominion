import {Command} from 'commander';
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {getContext} from './context';
import {Registry} from '@dominion.zone/dominion-sdk';
import {SuiObjectChange} from '@mysten/sui.js/client';

export const installCreatePublicRegistry = (program: Command) => {
  program.command('create-public-registry').action(createPublicRegistryAction);
};

const createPublicRegistryAction = async () => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK, appConfig, env, couchdb} = getContext();
  Registry.withCreatePublicRegistry({sdk: dominionSDK, txb});
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet.getPublicKey().toSuiAddress());
  const r = await dominionSDK.sui.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: txb,
    options: {
      showObjectChanges: true,
    },
  });
  console.log(r.digest);
  const registry = (
    (r.objectChanges as SuiObjectChange[])!.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value: any) =>
        value.objectType ===
        `${appConfig[env].registry.contract}::dominion_registry::DominionRegistry`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )! as any
  ).objectId;
  console.log(`Created public registry: ${registry}`);
  appConfig[env].registry.main = registry;

  await couchdb.put(process.env.VITE_CONFIG_PATH as string, appConfig, {
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          process.env.COUCHDB_USER + ':' + process.env.COUCHDB_PASSWORD
        ).toString('base64'),

      Referer: 'https://dominion.zone',
    },
  });
};
