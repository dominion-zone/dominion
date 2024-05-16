import {
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import useConfig from "../useConfig";
import { useCallback, useMemo } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CoinStruct } from "@mysten/sui.js/client";
import { useQueryClient } from "@tanstack/react-query";

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
  const config = useConfig({ network });
  const sui = useSuiClient();

  const mutateAsync = useCallback(
    async (
      { wallet, coinType, amount }: DepositToDominionParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      const coins: CoinStruct[] = [];
      let cursor = null;
      for (;;) {
        const { data, hasNextPage, nextCursor } = await sui.getCoins({
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

      const { data: dominionCoins } = await sui.getCoins({
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
        txb.moveCall({
          target: `${config.frameworkCommander.contract}::coin_commander::deposit`,
          typeArguments: [coinType],
          arguments: [
            txb.object(dominionId),
            txb.receivingRef({
              digest: dominionCoins[0].digest,
              objectId: dominionCoins[0].coinObjectId,
              version: dominionCoins[0].version,
            }),
            coin,
          ],
        });
      }
      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      return await mutation.mutateAsync({ transactionBlock: txb }, options);
    },
    [config.frameworkCommander.contract, dominionId, mutation, sui]
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
