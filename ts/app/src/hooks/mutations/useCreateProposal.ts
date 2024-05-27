import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import useSuspenseConfig from "../useSuspenseConfig";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useDominionSdk from "../useDominionSdk";
import { Dominion, Member } from "@dominion.zone/dominion-sdk";
import { Action } from "../../types/actions";
import useSuspenseMember from "../queries/useSuspenseMember";
import useSuspenseDominion from "../queries/useSuspenseDominion";
import { useSnackbar } from "notistack";
import { useNavigate } from "@tanstack/react-router";

export type CreateProposalParams = {
  name: string;
  link: string;
  actions?: Action[];
};

function useCreateProposal({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "createProposal", dominionId],
    onSuccess: () => {},
  });
  const config = useSuspenseConfig({ network });
  const dominionSdk = useDominionSdk({ network });

  const member = useSuspenseMember({ network, dominionId, wallet });
  const { dominion, governance } = useSuspenseDominion({ network, dominionId });
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const mutateAsync = useCallback(
    async (
      { name, link, actions = [] }: CreateProposalParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      if (!wallet) {
        throw new Error("Wallet is required");
      }

      const txb = new TransactionBlock();

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
      const r = await mutation.mutateAsync(
        { transactionBlock: txb, options: { showEvents: true } },
        options
      );
      const { proposal_id } = r.events!.find(
        (e) =>
          e.type ===
          `${dominionSdk.config.governance.contract}::proposal::ProposalCreated`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )!.parsedJson as any;
      enqueueSnackbar(`Proposal ${proposal_id} created successfully`, {
        variant: "success",
      });
      navigate({
        to: "/app/proposal/$proposalId",
        params: { proposalId: proposal_id },
        search: { network, wallet },
      });
      return {
        proposalId: proposal_id,
      };
    },
    [
      config.dominion.contract,
      config.testCoin,
      dominion.id,
      dominionSdk,
      enqueueSnackbar,
      governance.coinType,
      governance.id,
      member,
      mutation,
      navigate,
      network,
      wallet,
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
