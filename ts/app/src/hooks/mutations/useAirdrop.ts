import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
// import { useQueryClient } from "@tanstack/react-query";
import { Network } from "../../config/network";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useSuspenseConfig from "../useSuspenseConfig";
import { useSnackbar } from "notistack";

export type AirdropParams = {
  wallet: string;
  amount: bigint;
};

function useAirdrop({ network }: { network: Network }) {
  // const queryClient = useQueryClient();

  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "airdrop"],
    onSuccess: () => {},
  });

  const config = useSuspenseConfig({ network });
  const { enqueueSnackbar } = useSnackbar();

  const mutateAsync = useCallback(
    async (
      { wallet, amount }: AirdropParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const txb = new TransactionBlock();
      const coin = txb.moveCall({
        target: `${config.testCoin!.contract}::test_coin::mint_coin`,
        arguments: [txb.pure(amount), txb.object(config.testCoin!.control)],
      });
      txb.transferObjects([txb.object(coin)], wallet);
      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      const r = await mutation.mutateAsync({ transactionBlock: txb }, options);
      enqueueSnackbar(`Airdrop of ${amount} test tokens successful`, {
        variant: "success",
      });
      return r;
    },
    [config.testCoin, enqueueSnackbar, mutation]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: AirdropParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useAirdrop;
