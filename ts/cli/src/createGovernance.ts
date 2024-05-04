/* eslint-disable node/no-unsupported-features/es-builtins */
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {Command} from 'commander';
import {getContext} from './context';
import {Dominion, Governance, Member} from '@dominion.zone/dominion-sdk';

const testCoinType =
  '0x2c00b82adf4c1a39754a1eb2e1e69368245fa623b42b0b7ef36658aebf9ed670::test_coin::TEST_COIN';

export const installCreateGovernance = (program: Command) => {
  program
    .command('create-governance')
    .option('--name <name>', 'Name of the governance', 'Test governance')
    .option(
      '--coin-type <coinType>',
      'Coin type of the governance',
      testCoinType
    )
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
  coinType,
  link,
  minWeightToCreateProposal,
  voteThreshold,
  maxVotingTime,
}: {
  name: string;
  coinType: string;
  link: string;
  minWeightToCreateProposal: string;
  voteThreshold: string;
  maxVotingTime: string;
}) => {
  const txb = new TransactionBlock();
  const {wallet, dominionSDK: sdk} = getContext();
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

  const member = Member.withNew({sdk, governance, coinType, txb});

  if (coinType === testCoinType) {
    // txb.
    const coin = txb.moveCall({
      target:
        '0x2c00b82adf4c1a39754a1eb2e1e69368245fa623b42b0b7ef36658aebf9ed670::test_coin::mint_coin',
      arguments: [
        txb.pure(1000000000000),
        txb.object(
          '0x133cbe3937328734e4061452a258c0c56f31027d8e948fe40e748d670ea0629e'
        ),
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
};
