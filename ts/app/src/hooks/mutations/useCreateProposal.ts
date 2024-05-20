import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import useConfig from "../useConfig";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useQueryClient } from "@tanstack/react-query";
import useDominionSdk from "../useDominionSdk";
import userMembersQO from "../../queryOptions/user/userMembersQO";
import { Dominion, Member } from "@dominion.zone/dominion-sdk";
import dominionQO from "../../queryOptions/dominionQO";
import { Action } from "../../types/actions";

export type CreateProposalParams = {
  wallet: string;
  name: string;
  link: string;
  actions?: Action[];
};

function useCreateProposal({
  network,
  dominionId,
}: {
  network: Network;
  dominionId: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "createProposal", dominionId],
    onSuccess: () => {},
  });
  const config = useConfig({ network });
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();

  const mutateAsync = useCallback(
    async (
      { wallet, name, link, actions = [] }: CreateProposalParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const { dominion, governance } = await queryClient.fetchQuery(
        dominionQO({ network, dominionId, queryClient })
      );
      const txb = new TransactionBlock();

      const members = await queryClient.fetchQuery(
        userMembersQO({ network, wallet, queryClient })
      );
      const member = members.find(
        (m) => m.governanceId === dominion.ownerAddress
      );

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

      const proposalBuilder = Member.withNewProposal({
        sdk: dominionSdk,
        member: memberArg,
        coinType: governance.coinType,
        governance: txb.object(governance.id),
        name,
        link,
        txb,
      });

      const commands = actions.map((action) => {
        switch (action.type) {
          case "enableCommander":
          case "disableCommander":
            return Dominion.withNewEnableCommanderCommand({
              sdk: dominionSdk,
              dominion: dominion.id,
              targetDominion: dominion.id,
              commander: action.commander,
              txb,
            });
          case "transferCoin":
            return dominionSdk.coinCommander.withCreateCommand({
              sdk: dominionSdk,
              txb,
              dominion: dominion.id,
              action: {
                type: "transferCoin",
                coinType: action.coinType,
                recipient: action.recipient,
                amount: BigInt(action.amount),
              },
            });
          default:
            throw new Error("Invalid action type");
        }
      });

      Member.withAddOption({
        sdk: dominionSdk,
        proposalBuilder,
        coinType: governance.coinType,
        label: "yes",
        commands: txb.makeMoveVec({
          type: `${config.dominion.contract}::command::Command`,
          objects: commands,
        }),
        txb,
      });

      Member.withStart({
        sdk: dominionSdk,
        proposalBuilder,
        coinType: governance.coinType,
        delay: 0n,
        txb,
      });

      Member.withCommit({
        sdk: dominionSdk,
        proposalBuilder,
        coinType: governance.coinType,
        member: memberArg,
        txb,
      });

      if (!member) {
        txb.transferObjects([memberArg], wallet);
      }

      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      return await mutation.mutateAsync({ transactionBlock: txb }, options);
    },
    [
      config.dominion.contract,
      config.testCoin,
      dominionId,
      dominionSdk,
      mutation,
      network,
      queryClient,
    ]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: CreateProposalParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useCreateProposal;
