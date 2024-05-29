import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { Member } from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useDominionSdk from "../useDominionSdk";
import { CoinStruct } from "@mysten/sui.js/client";
import useSuspenseMember from "../queries/useSuspenseMember";
import useSuspenseDominion from "../queries/useSuspenseDominion";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type LockTokensParams = TransactionOptions & {
  amount: bigint;
};

export type AirdropResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
};

export type UseLockTokensOptions = UseSignAndExecuteTransactionOptions<
  AirdropResult,
  Error,
  LockTokensParams
> & {
  network: Network;
  dominionId: string;
  wallet: string;
};

function useLockTokens({
  network,
  dominionId,
  wallet,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseLockTokensOptions) {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const member = useSuspenseMember({ network, dominionId, wallet });
  const { governance } = useSuspenseDominion({ network, dominionId });

  return useMutation({
    mutationKey: [network, "lockTokens", wallet, dominionId],
    async mutationFn({ amount, ...options }) {
      const coins: CoinStruct[] = [];
      let cursor = null;
      for (;;) {
        const { data, hasNextPage, nextCursor } =
          await dominionSdk.sui.getCoins({
            owner: wallet,
            coinType: governance.coinType,
            cursor,
          });
        coins.push(...data);
        if (!hasNextPage) {
          break;
        }
        cursor = nextCursor;
      }
      if (coins.length === 0) {
        throw new Error(`You have no ${governance.coinType} coins`);
      }

      const transactionBlock = new TransactionBlock();

      let memberArg;

      if (member) {
        memberArg = transactionBlock.object(member.id);
      } else {
        memberArg = transactionBlock.object(
          Member.withNew({
            sdk: dominionSdk,
            txb: transactionBlock,
            coinType: governance.coinType,
            governance: transactionBlock.object(governance.id),
          })
        );
      }
      let source = transactionBlock.gas;
      if (governance.coinType !== "0x2::sui::SUI") {
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
      Member.withDeposit({
        sdk: dominionSdk,
        member: memberArg,
        coinType: governance.coinType,
        coin,
        txb: transactionBlock,
      });
      if (!member) {
        transactionBlock.transferObjects([memberArg], wallet);
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

export default useLockTokens;
