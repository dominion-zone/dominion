import {
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Network } from "../../config/network";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import useSuspenseConfig from "../useSuspenseConfig";
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";

export type AirdropParams = TransactionOptions & {
  amount: bigint;
};

export type AirdropResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
};

export type UseAirdropOptions = UseSignAndExecuteTransactionOptions<
  AirdropResult,
  Error,
  AirdropParams
> & {
  network: Network;
  wallet: string;
};

function useAirdrop({
  network,
  wallet,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseAirdropOptions): UseMutationResult<AirdropResult, Error, AirdropParams> {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const config = useSuspenseConfig({ network });
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [network, "airdrop", wallet],
    async mutationFn({ amount, ...options }) {
      const transactionBlock = new TransactionBlock();
      const coin = transactionBlock.moveCall({
        target: `${config.testCoin!.contract}::test_coin::mint_coin`,
        arguments: [
          transactionBlock.pure(amount),
          transactionBlock.object(config.testCoin!.control),
        ],
      });
      transactionBlock.transferObjects([transactionBlock.object(coin)], wallet);
      transactionBlock.setGasBudget(2000000000);
      transactionBlock.setSenderIfNotSet(wallet);

      const tx = await signAndExecuteTransactionBlock({
        client,
        currentWallet,
        currentAccount,
        transactionBlock,
        ...options,
        onTransactionSuccess(tx) {
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "coinBalance", `${config.testCoin!.contract}::test_coin::TEST_COIN`]
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "allCoinBalances"]
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

export default useAirdrop;
