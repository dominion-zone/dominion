import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { Member } from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useDominionSdk from "../useDominionSdk";
import useSuspenseMember from "../queries/useSuspenseMember";
import useSuspenseDominion from "../queries/useSuspenseDominion";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UnlockTokensParams = TransactionOptions & {
  amount: bigint;
};

export type UnlockTokensResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
};

export type UseUnlockTokensOptions = UseSignAndExecuteTransactionOptions<
  UnlockTokensResult,
  Error,
  UnlockTokensParams
> & {
  network: Network;
  dominionId: string;
  wallet: string;
};


function useUnlockTokens({
  network,
  dominionId,
  wallet,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseUnlockTokensOptions) {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const member = useSuspenseMember({ network, dominionId, wallet });
  const { governance } = useSuspenseDominion({ network, dominionId });

  return useMutation({
    mutationKey: [network, "withdraw", dominionId],
    async mutationFn({ amount, ...options }) {
      if (!member) {
        throw new Error("Member is required");
      }

      const transactionBlock = new TransactionBlock();

      Member.withWithdraw({
        sdk: dominionSdk,
        member: transactionBlock.object(member.id),
        coinType: governance.coinType,
        amount,
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
            queryKey: [
              network,
              "user",
              wallet,
              "coinBalance",
              governance.coinType,
            ],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "allCoinBalances"],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "members"],
          });
          if (onTransactionSuccess) {
            onTransactionSuccess({ tx }, { amount }, undefined);
          }
        },
        onTransactionError(tx, error) {
          if (onTransactionError) {
            onTransactionError({ tx }, error, { amount }, undefined);
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

export default useUnlockTokens;
