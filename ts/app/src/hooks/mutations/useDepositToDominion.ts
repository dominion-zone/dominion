import {
  useCurrentAccount,
  useCurrentWallet,
} from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CoinStruct } from "@mysten/sui.js/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CoinCommander } from "@dominion.zone/dominion-sdk";
import useDominionSdk from "../useDominionSdk";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";
import { SUI_COIN_TYPE } from "../../consts";

export type DepositToDominionParams = TransactionOptions & {
  coinType: string;
  amount: bigint;
};

export type DepositToDominionResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
};

export type UseDepositToDominionOptions = UseSignAndExecuteTransactionOptions<
  DepositToDominionResult,
  Error,
  DepositToDominionParams
> & {
  network: Network;
  dominionId: string;
  wallet: string;
};

function useDepositToDominion({
  network,
  dominionId,
  wallet,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseDepositToDominionOptions) {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [network, "depoitToDominion", wallet, dominionId],
    async mutationFn({ coinType, amount, ...options }) {
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

      const transactionBlock = new TransactionBlock();
      let source = transactionBlock.gas;
      if (coinType !== SUI_COIN_TYPE) {
        source = transactionBlock.object(coins[0].coinObjectId);
        if (coins.length > 1) {
          transactionBlock.mergeCoins(
            source,
            coins
              .slice(1)
              .map(({ coinObjectId }) => transactionBlock.object(coinObjectId))
          );
        }
      }
      const [coin] = transactionBlock.splitCoins(source, [amount]);
      if (dominionCoins.length === 0) {
        transactionBlock.transferObjects(
          [transactionBlock.object(coin)],
          transactionBlock.pure(dominionId)
        );
      } else {
        CoinCommander.withDeposit({
          sdk: dominionSdk,
          txb: transactionBlock,
          coinType,
          dominion: dominionId,
          source: coin,
          target: {
            ...dominionCoins[0],
            objectId: dominionCoins[0].coinObjectId,
          },
        });
      }
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
            queryKey: [network, "dominion", dominionId, "assets"],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "coinBalance", coinType],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "allCoinBalances"],
          });
          if (onTransactionSuccess) {
            onTransactionSuccess({ tx }, { coinType, amount }, undefined);
          }
        },
        onTransactionError(tx, error) {
          if (onTransactionError) {
            onTransactionError({ tx }, error, { coinType, amount }, undefined);
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

export default useDepositToDominion;
