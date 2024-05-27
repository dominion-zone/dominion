import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { useCallback, useMemo } from "react";
import { Member } from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useDominionSdk from "../useDominionSdk";
import useSuspenseMember from "../queries/useSuspenseMember";
import useSuspenseDominion from "../queries/useSuspenseDominion";
import { useSnackbar } from "notistack";

export type WithdrawParams = {
  amount: bigint;
};

function useWithdraw({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "withdraw", dominionId],
    onSuccess: () => {},
  });

  const dominionSdk = useDominionSdk({ network });

  const member = useSuspenseMember({ network, dominionId, wallet });
  const { governance } = useSuspenseDominion({ network, dominionId });
  const { enqueueSnackbar } = useSnackbar();

  const mutateAsync = useCallback(
    async (
      { amount }: WithdrawParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      if (!wallet) {
        throw new Error("Wallet is required");
      }
      if (!member) {
        throw new Error("Member is required");
      }

      const txb = new TransactionBlock();

      Member.withWithdraw({
        sdk: dominionSdk,
        member: txb.object(member.id),
        coinType: governance.coinType,
        amount,
        txb,
      });
      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      const r = await mutation.mutateAsync({ transactionBlock: txb }, options);
      enqueueSnackbar(
        `Withdrawing ${amount} of ${governance.coinType} successfully`,
        {
          variant: "success",
        }
      );
      return r;
    },
    [
      dominionSdk,
      enqueueSnackbar,
      governance.coinType,
      member,
      mutation,
      wallet,
    ]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: WithdrawParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useWithdraw;
