import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CoinStruct } from "@mysten/sui.js/client";
import { useQueryClient } from "@tanstack/react-query";
import { CoinCommander } from "@dominion.zone/dominion-sdk";
import useDominionSdk from "../useDominionSdk";
import { useSnackbar } from "notistack";

export type DepositToDominionParams = {
  wallet: string;
  coinType: string;
  amount: bigint;
};

function useDepositToDominion({
  network,
  dominionId,
}: {
  network: Network;
  dominionId: string;
}) {
  const queryClient = useQueryClient();

  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "depoitToDominion", dominionId],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [network, "dominion", dominionId, "assets"],
      });
    },
  });
  const dominionSdk = useDominionSdk({ network });
  const { enqueueSnackbar } = useSnackbar();

  const mutateAsync = useCallback(
    async (
      { wallet, coinType, amount }: DepositToDominionParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const coins: CoinStruct[] = [];
      let cursor = null;
      for (;;) {
        const { data, hasNextPage, nextCursor } =
          await dominionSdk.sui.getCoins({
            owner: wallet,
            coinType,
            cursor,
          });
        coins.push(...data);
        if (!hasNextPage) {
          break;
        }
        cursor = nextCursor;
      }
      if (coins.length === 0) {
        throw new Error(`You have no ${coinType} coins`);
      }

      const { data: dominionCoins } = await dominionSdk.sui.getCoins({
        owner: dominionId,
        coinType,
      });

      const txb = new TransactionBlock();
      let source = txb.gas;
      if (coinType !== "0x2::sui::SUI") {
        source = txb.object(coins[0].coinObjectId);
        if (coins.length > 1) {
          txb.mergeCoins(
            source,
            coins.slice(1).map(({ coinObjectId }) => txb.object(coinObjectId))
          );
        }
      }
      const [coin] = txb.splitCoins(source, [amount]);
      if (dominionCoins.length === 0) {
        txb.transferObjects([txb.object(coin)], txb.pure(dominionId));
      } else {
        CoinCommander.withDeposit({
          sdk: dominionSdk,
          txb,
          coinType,
          dominion: dominionId,
          source: coin,
          target: {
            ...dominionCoins[0],
            objectId: dominionCoins[0].coinObjectId,
          },
        });
      }
      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      const r = await mutation.mutateAsync({ transactionBlock: txb }, options);
      enqueueSnackbar(`Deposited ${amount} ${coinType} to dominion`, {
        variant: "success",
      });
      return r;
    },
    [dominionId, dominionSdk, enqueueSnackbar, mutation]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: DepositToDominionParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useDepositToDominion;
