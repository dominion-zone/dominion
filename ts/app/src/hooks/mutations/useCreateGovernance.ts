import { Network } from "../../config/network";
import {
  Dominion,
  DominionSDK,
  Governance,
  Member,
  Registry,
} from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import useDominionSdk from "../useDominionSdk";
import useConfig from "../useConfig";
import { Config } from "../../queryOptions/configQO";
import { registryQO } from "../../queryOptions/registryQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type CreateGovernanceParams = {
  name: string;
  coinType: string;
  urlName: string;
  link: string;
  minWeightToCreateProposal: bigint;
  voteThreshold: bigint;
  maxVotingTime: bigint;
};

function createTxb({
  config,
  registry,
  sdk,
  wallet,
  name,
  coinType,
  urlName,
  link,
  minWeightToCreateProposal,
  voteThreshold,
  maxVotingTime,
}: CreateGovernanceParams & {
  config: Config;
  registry: Registry;
  sdk: DominionSDK;
  wallet: string;
}) {
  const txb = new TransactionBlock();

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

  const { governance, governanceAdminCap, vetoCap } = Governance.withNew({
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
      target: "0x2::object::id_address",
      typeArguments: [`${sdk.config.dominion.contract}::dominion::Dominion`],
      arguments: [txb.object(dominion)],
    })
  );

  const member = Member.withNew({ sdk, governance, coinType, txb });

  if (coinType === `${config.testCoin?.contract}::test_coin::TEST_COIN`) {
    const coin = txb.moveCall({
      target: `${config.testCoin!.contract}::test_coin::mint_coin`,
      arguments: [
        txb.pure(1000000000000),
        txb.object(config.testCoin!.control),
      ],
    });

    Member.withDeposit({ sdk, member, coinType, coin, txb });
  }
  Dominion.withCommit({ sdk, dominion, txb });
  Governance.withCommit({ sdk, governance, coinType, txb });
  txb.transferObjects([txb.object(vetoCap), txb.object(member)], wallet);
  txb.setGasBudget(2000000000);
  txb.setSenderIfNotSet(wallet);

  return txb;
}

function useCreateGovernance({
  network,
  wallet,
}: {
  network: Network;
  wallet: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "createGovernance"],
  });
  const config = useConfig({ network });
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const { data: registry } = useSuspenseQuery(
    registryQO({ network, queryClient })
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: CreateGovernanceParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        const txb = createTxb({
          config,
          registry,
          sdk: dominionSdk,
          wallet,
          ...params,
        });
        return mutation.mutate({ transactionBlock: txb }, options);
      },
      mutateAsync(
        params: CreateGovernanceParams,
        options?: Parameters<typeof mutation.mutateAsync>[1]
      ) {
        const txb = createTxb({
          config,
          registry,
          sdk: dominionSdk,
          wallet,
          ...params,
        });
        return mutation.mutateAsync({ transactionBlock: txb }, options);
      },
    }),
    [config, dominionSdk, mutation, registry, wallet]
  );
}

export default useCreateGovernance;
