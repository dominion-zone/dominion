import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { useCallback, useMemo } from "react";
import { Member } from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useDominionSdk from "../useDominionSdk";
import { CoinStruct } from "@mysten/sui.js/client";
import useSuspenseMember from "../queries/useSuspenseMember";
import useSuspenseDominion from "../queries/useSuspenseDominion";

export type LockTokensParams = {
  amount: bigint;
};

function useLockTokens({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const mutation = useSignAndExecuteTransactionBlock({
    mutationKey: [network, "lockTokens", dominionId],
    onSuccess: () => {},
  });

  const dominionSdk = useDominionSdk({ network });

  const member = useSuspenseMember({ network, dominionId, wallet });
  const { governance } = useSuspenseDominion({ network, dominionId });

  const mutateAsync = useCallback(
    async (
      { amount }: LockTokensParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => {
      if (!wallet) {
        throw new Error("Wallet is required");
      }
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

      const txb = new TransactionBlock();

      let memberArg;

      if (member) {
        memberArg = txb.object(member.id);
      } else {
        memberArg = txb.object(
          Member.withNew({
            sdk: dominionSdk,
            txb,
            coinType: governance.coinType,
            governance: txb.object(governance.id),
          })
        );
      }
      let source = txb.gas;
      if (governance.coinType !== "0x2::sui::SUI") {
        source = txb.object(coins[0].coinObjectId);
        if (coins.length > 1) {
          txb.mergeCoins(
            source,
            coins.slice(1).map(({ coinObjectId }) => txb.object(coinObjectId))
          );
        }
      }
      const [coin] = txb.splitCoins(source, [amount]);
      Member.withDeposit({
        sdk: dominionSdk,
        member: memberArg,
        coinType: governance.coinType,
        coin,
        txb,
      });
      txb.setGasBudget(2000000000);
      txb.setSenderIfNotSet(wallet);
      return await mutation.mutateAsync({ transactionBlock: txb }, options);
    },
    [dominionSdk, governance.coinType, governance.id, member, mutation, wallet]
  );

  return useMemo(
    () => ({
      ...mutation,
      mutate(
        params: LockTokensParams,
        options?: Parameters<typeof mutation.mutate>[1]
      ) {
        mutateAsync(params, options);
      },
      mutateAsync,
    }),
    [mutateAsync, mutation]
  );
}

export default useLockTokens;
