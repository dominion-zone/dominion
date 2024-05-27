import { Network } from "../../config/network";
import { Dominion, Governance, Member } from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import useDominionSdk from "../useDominionSdk";
import useSuspenseConfig from "../useSuspenseConfig";
import { registryQO } from "../../queryOptions/registryQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "@tanstack/react-router";

export type CreateGovernanceParams = {
  name: string;
  coinType: string;
  urlName: string;
  link: string;
  minWeightToCreateProposal: bigint;
  voteThreshold: bigint;
  maxVotingTime: bigint;
};

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
  const config = useSuspenseConfig({ network });
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const { data: registry } = useSuspenseQuery(
    registryQO({ network, queryClient })
  );
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const mutateAsync = useCallback(
    async (
      {
        name,
        coinType,
        urlName,
        link,
        minWeightToCreateProposal,
        voteThreshold,
        maxVotingTime,
      }: CreateGovernanceParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const txb = new TransactionBlock();

      const {
        dominion,
        adminCap: dominionAdminCap,
        ownerCap,
      } = Dominion.withNew({
        sdk: dominionSdk,
        txb,
      });

      Dominion.withEnableAdminCommander({
        sdk: dominionSdk,
        dominion,
        adminCap: dominionAdminCap,
        txb,
      });
      Governance.withEnableAdminCommander({
        sdk: dominionSdk,
        dominion,
        adminCap: dominionAdminCap,
        txb,
      });
      dominionSdk.coinCommander.withEnable({
        sdk: dominionSdk,
        txb,
        dominion,
        adminCap: dominionAdminCap,
      });
      registry.withPushBackEntry({
        dominion,
        urlName,
        adminCap: dominionAdminCap,
        txb,
      });

      const { governance, governanceAdminCap, vetoCap } = Governance.withNew({
        sdk: dominionSdk,
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
          typeArguments: [
            `${dominionSdk.config.dominion.contract}::dominion::Dominion`,
          ],
          arguments: [txb.object(dominion)],
        })
      );

      const member = Member.withNew({
        sdk: dominionSdk,
        governance,
        coinType,
        txb,
      });

      if (coinType === `${config.testCoin?.contract}::test_coin::TEST_COIN`) {
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

      const r = await mutation.mutateAsync(
        { transactionBlock: txb, options: { showEvents: true } },
        options
      );
      const { dominion_id, url_name } = (
        r.events!.find(
          (e) =>
            e.type ===
            `${dominionSdk.config.registry.contract}::dominion_registry::EntryInserted`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )!.parsedJson as any
      ).entry;

      enqueueSnackbar(`Dominion ${dominion_id} created successfully`, {
        variant: "success",
      });

      navigate({
        to: "/app/dominion/$dominionId",
        params: { dominionId: dominion_id },
        search: { network, wallet },
      });

      return {
        transaction: r.digest,
        dominionId: dominion_id,
        urlName: url_name,
      };
    },
    [
      config.testCoin,
      dominionSdk,
      enqueueSnackbar,
      mutation,
      navigate,
      network,
      registry,
      wallet,
    ]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: CreateGovernanceParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useCreateGovernance;
