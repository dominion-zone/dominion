import { Network } from "../../config/network";
import {
  Dominion,
  DominionSDK,
  Governance,
  Member,
} from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import useDominionSdk from "../useDominionSdk";
import useConfig from "../useConfig";
import { Config } from "../../queryOptions/configQO";

function createTxb({
  config,
  dominionSdk,
  wallet,
  name,
  coinType,
  link,
  minWeightToCreateProposal,
  voteThreshold,
  maxVotingTime,
}: {
  config: Config;
  dominionSdk: DominionSDK;
  wallet: string;
  name: string;
  coinType: string;
  link: string;
  minWeightToCreateProposal: bigint;
  voteThreshold: bigint;
  maxVotingTime: bigint;
}) {
  const txb = new TransactionBlock();
  const { dominion, governance, vetoCap } =
    Governance.withNewSelfControlledDominionAndGovernance({
      sdk: dominionSdk,
      name,
      coinType,
      link,
      minWeightToCreateProposal,
      voteThreshold,
      maxVotingTime,
      txb,
    });

  const member = Member.withNew({
    sdk: dominionSdk,
    governance,
    coinType,
    txb,
  });
  const testCoinType: string | undefined =
    config.testCoin && `${config.testCoin.contract}::test_coin::TEST_COIN`;
  if (coinType === testCoinType) {
    // txb.
    const coin = txb.moveCall({
      target: `${config.testCoin!.contract}::test_coin::mint_coin`,
      arguments: [
        txb.pure(1000000000000),
        txb.object(config.testCoin!.control),
      ],
    });

    Member.withDeposit({ sdk: dominionSdk, member, coinType, coin, txb });
  }
  Dominion.withCommit({ sdk: dominionSdk, dominion, txb });
  Governance.withCommit({ sdk: dominionSdk, governance, coinType, txb });
  txb.transferObjects([txb.object(vetoCap), txb.object(member)], wallet);
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet);

  return txb;
}

export const useCreateGovernance = ({
  network,
  name,
  coinType,
  link,
  minWeightToCreateProposal,
  voteThreshold,
  maxVotingTime,
}: {
  network: Network;
  name: string;
  coinType: string;
  link: string;
  minWeightToCreateProposal: bigint;
  voteThreshold: bigint;
  maxVotingTime: bigint;
}) => {
  const wallet = useCurrentAccount()?.address;
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [
      network,
      "createGovernance",
      {
        name,
        coinType,
        link,
      },
    ],
  });
  const config = useConfig();
  const dominionSdk = useDominionSdk();

  return {
    ...mutation,
    mutate(options?: Parameters<typeof mutation.mutate>[1]) {
      const txb = createTxb({
        config,
        dominionSdk,
        wallet: wallet!,
        name,
        coinType,
        link,
        minWeightToCreateProposal,
        voteThreshold,
        maxVotingTime,
      });
      return mutation.mutate({ transactionBlock: txb }, options);
    },
    mutateAsync(options?: Parameters<typeof mutation.mutateAsync>[1]) {
      const txb = createTxb({
        config,
        dominionSdk,
        wallet: wallet!,
        name,
        coinType,
        link,
        minWeightToCreateProposal,
        voteThreshold,
        maxVotingTime,
      });
      return mutation.mutateAsync({ transactionBlock: txb }, options);
    },
  };
};
