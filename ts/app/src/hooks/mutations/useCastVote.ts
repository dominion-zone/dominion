import {
  useCurrentAccount,
  useCurrentWallet,
} from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import useSuspenseConfig from "../useSuspenseConfig";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useDominionSdk from "../useDominionSdk";
import userMembersQO from "../../queryOptions/user/userMembersQO";
import { Member } from "@dominion.zone/dominion-sdk";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import useSuspenseProposal from "../queries/useSuspenseProposal";
import useSuspenseGovernance from "../queries/useSuspenseGovernance";

export type CastVoteParams = TransactionOptions & {
  optionIndex: bigint | null;
  isAbstain: boolean;
  reliquish: boolean;
};

export type CastVoteResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
};

export type UseCastVoteOptions = UseSignAndExecuteTransactionOptions<
  CastVoteResult,
  Error,
  CastVoteParams
> & {
  network: Network;
  wallet: string;
  proposalId: string;
};

function useCastVote({
  network,
  wallet,
  proposalId,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseCastVoteOptions) {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const config = useSuspenseConfig({ network });
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const proposal = useSuspenseProposal({
    network,
    proposalId,
  });
  const governance = useSuspenseGovernance({
    network,
    governanceId: proposal.governanceId,
  });

  return useMutation({
    mutationKey: [network, "castVote", wallet, proposalId],
    async mutationFn({ optionIndex, isAbstain, reliquish, ...options }) {
      const transactionBlock = new TransactionBlock();

      const members = await queryClient.fetchQuery(
        userMembersQO({ network, wallet, queryClient })
      );
      const member = members.find((m) => m.governanceId === governance.id);

      let memberArg;

      if (member) {
        memberArg = transactionBlock.object(member.id);
      } else {
        if (
          governance.coinType ===
          `${config.testCoin?.contract}::test_coin::TEST_COIN`
        ) {
          memberArg = transactionBlock.object(
            Member.withNew({
              sdk: dominionSdk,
              txb: transactionBlock,
              coinType: governance.coinType,
              governance: transactionBlock.object(governance.id),
            })
          );
          const coin = transactionBlock.moveCall({
            target: `${config.testCoin!.contract}::test_coin::mint_coin`,
            arguments: [
              transactionBlock.pure(1000000000000),
              transactionBlock.object(config.testCoin!.control),
            ],
          });

          Member.withDeposit({
            sdk: dominionSdk,
            member: memberArg,
            coinType: governance.coinType,
            coin,
            txb: transactionBlock,
          });
        } else {
          throw new Error("Participate in the governance first");
        }
      }

      Member.withCastVote({
        sdk: dominionSdk,
        member: memberArg,
        coinType: governance.coinType,
        proposal: transactionBlock.object(proposalId),
        optionIndex: optionIndex,
        isAbstain,
        reliquish,
        txb: transactionBlock,
      });

      transactionBlock.setGasBudget(2000000000);
      transactionBlock.setSenderIfNotSet(wallet);
      const tx = await signAndExecuteTransactionBlock({
        client: dominionSdk.sui,
        currentWallet,
        currentAccount,
        transactionBlock,
        ...options,
        onTransactionSuccess(tx) {
          queryClient.invalidateQueries({
            queryKey: [network, "proposal", proposalId],
          });
          if (onTransactionSuccess) {
            onTransactionSuccess(
              { tx },
              { optionIndex, isAbstain, reliquish },
              undefined
            );
          }
        },
        onTransactionError(tx, error) {
          if (onTransactionError) {
            onTransactionError(
              { tx },
              error,
              { optionIndex, isAbstain, reliquish },
              undefined
            );
          }
        },
      });

      return {
        tx,
      };
    },
    ...mutationOptions,
  });
}

export default useCastVote;
