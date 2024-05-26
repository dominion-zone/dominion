import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import useSuspenseConfig from "../useSuspenseConfig";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useQueryClient } from "@tanstack/react-query";
import useDominionSdk from "../useDominionSdk";
import userMembersQO from "../../queryOptions/user/userMembersQO";
import { Member } from "@dominion.zone/dominion-sdk";
import proposalQO from "../../queryOptions/proposalQO";
import governanceQO from "../../queryOptions/governanceQO";

export type CastVoteParams = {
  wallet: string;
  optionIndex: bigint | null;
  isAbstain: boolean;
  reliquish: boolean;
};

function useCastVote({
  network,
  proposalId,
}: {
  network: Network;
  proposalId: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "castVote", proposalId],
    onSuccess: () => {},
  });
  const config = useSuspenseConfig({ network });
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();

  const mutateAsync = useCallback(
    async (
      { wallet, optionIndex, isAbstain, reliquish }: CastVoteParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const proposal = await queryClient.fetchQuery(
        proposalQO({ network, proposalId, queryClient })
      );
      const governance = await queryClient.fetchQuery(
        governanceQO({
          network,
          governanceId: proposal.governanceId,
          queryClient,
        })
      );

      const txb = new TransactionBlock();

      const members = await queryClient.fetchQuery(
        userMembersQO({ network, wallet, queryClient })
      );
      const member = members.find((m) => m.governanceId === governance.id);

      let memberArg;

      if (member) {
        memberArg = txb.object(member.id);
      } else {
        if (
          governance.coinType ===
          `${config.testCoin?.contract}::test_coin::TEST_COIN`
        ) {
          memberArg = txb.object(
            Member.withNew({
              sdk: dominionSdk,
              txb,
              coinType: governance.coinType,
              governance: txb.object(governance.id),
            })
          );
          const coin = txb.moveCall({
            target: `${config.testCoin!.contract}::test_coin::mint_coin`,
            arguments: [
              txb.pure(1000000000000),
              txb.object(config.testCoin!.control),
            ],
          });

          Member.withDeposit({
            sdk: dominionSdk,
            member: memberArg,
            coinType: governance.coinType,
            coin,
            txb,
          });
        } else {
          throw new Error("Participate in the governance first");
        }
      }

      Member.withCastVote({
        sdk: dominionSdk,
        member: memberArg,
        coinType: governance.coinType,
        proposal: txb.object(proposalId),
        optionIndex: optionIndex,
        isAbstain,
        reliquish,
        txb,
      });

      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      console.log(txb.serialize())
      const r = await dominionSdk.sui.dryRunTransactionBlock({ transactionBlock: await txb.build({
        client: dominionSdk.sui,
      }) });
      console.log(r);
      return await mutation.mutateAsync({ transactionBlock: txb }, options);
    },
    [config.testCoin, dominionSdk, mutation, network, proposalId, queryClient]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: CastVoteParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useCastVote;
