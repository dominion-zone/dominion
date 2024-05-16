/* eslint-disable node/no-unsupported-features/es-builtins */
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {Command} from 'commander';
import {getContext} from './context';
import {
  Dominion,
  Governance,
  Member,
  Registry,
} from '@dominion.zone/dominion-sdk';

export const installCreateGovernance = (program: Command) => {
  program
    .command('create-governance')
    .option('--url-name <name>', 'Name for URL')
    .option('--name <name>', 'Name of the governance', 'Test governance')
    .option('--coin-type <coinType>', 'Coin type of the governance')
    .option(
      '--link <link>',
      'Link to the governance website',
      'https://example.com'
    )
    .option(
      '--min-weight-to-create-proposal <minWeightToCreateProposal>',
      'Minimum weight to create a proposal',
      '0'
    )
    .option('--vote-threshold <voteThreshold>', 'Vote threshold', '0')
    .option('--max-voting-time <maxVotingTime>', 'Max voting time', '0')

    .action(createGovernanceAction);
};

const createGovernanceAction = async ({
  name,
  urlName,
  coinType,
  link,
  minWeightToCreateProposal,
  voteThreshold,
  maxVotingTime,
}: {
  name: string;
  urlName?: string;
  coinType?: string;
  link: string;
  minWeightToCreateProposal: string;
  voteThreshold: string;
  maxVotingTime: string;
}) => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK: sdk, appConfig, env} = getContext();

  if (!coinType) {
    coinType = `${appConfig[env].testCoin!.contract}::test_coin::TEST_COIN`;
  }

  const registry = await Registry.fetch({
    sdk,
    id: appConfig[env].registry.main!,
  });

  /*
  const {dominion, governance, vetoCap} =
    Governance.withNewSelfControlledDominionAndGovernance({
      sdk,
      name,
      coinType,
      link,
      minWeightToCreateProposal: BigInt(minWeightToCreateProposal),
      voteThreshold: BigInt(voteThreshold),
      maxVotingTime: BigInt(maxVotingTime),
      txb,
    });
  */
  const {
    dominion,
    adminCap: dominionAdminCap,
    ownerCap,
  } = Dominion.withNew({
    sdk,
    txb,
  });

  Dominion.withEnableAdminCommander({
    sdk,
    dominion,
    adminCap: dominionAdminCap,
    txb,
  });
  Governance.withEnableAdminCommander({
    sdk,
    dominion,
    adminCap: dominionAdminCap,
    txb,
  });
  sdk.withEnableCoinCommander({txb, dominion, adminCap: dominionAdminCap});
  registry.withPushBackEntry({
    dominion,
    urlName,
    adminCap: dominionAdminCap,
    txb,
  });

  const {governance, governanceAdminCap, vetoCap} = Governance.withNew({
    sdk,
    dominion,
    dominionOwnerCap: ownerCap,
    name,
    coinType,
    link,
    minWeightToCreateProposal: BigInt(minWeightToCreateProposal),
    voteThreshold: BigInt(voteThreshold),
    maxVotingTime: BigInt(maxVotingTime),
    txb,
  });

  txb.transferObjects(
    [txb.object(dominionAdminCap), txb.object(governanceAdminCap)],
    txb.moveCall({
      target: '0x2::object::id_address',
      typeArguments: [`${sdk.config.dominion.contract}::dominion::Dominion`],
      arguments: [txb.object(dominion)],
    })
  );

  const member = Member.withNew({sdk, governance, coinType, txb});

  if (
    coinType === `${appConfig[env].testCoin?.contract}::test_coin::TEST_COIN`
  ) {
    const coin = txb.moveCall({
      target: `${appConfig[env].testCoin!.contract}::test_coin::mint_coin`,
      arguments: [
        txb.pure(1000000000000),
        txb.object(appConfig[env].testCoin!.control),
      ],
    });

    Member.withDeposit({sdk, member, coinType, coin, txb});
  }
  Dominion.withCommit({sdk, dominion, txb});
  Governance.withCommit({sdk, governance, coinType, txb});
  txb.transferObjects(
    [txb.object(vetoCap), txb.object(member)],
    wallet.getPublicKey().toSuiAddress()
  );
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet.getPublicKey().toSuiAddress());
  const r = await sdk.sui.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: txb,
  });
  console.log(r.digest);
  if (r.errors) {
    throw r.errors;
  }
};
