import { SuiClient } from "@mysten/sui.js/client";
import {
  SuiSignAndExecuteTransactionBlockInput,
  SuiSignAndExecuteTransactionBlockOutput,
  WalletAccount,
  WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import { UseMutationOptions } from "@tanstack/react-query";

export type UseSignAndExecuteTransactionOptions<
  TData,
  TError,
  TVariables = void,
  TContext = unknown,
> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "mutationFn"
> & {
  onTransactionSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext
  ) => void;
  onTransactionError?: (
    data: TData,
    error: string[],
    variables: TVariables,
    context: TContext
  ) => void;
};

export type TransactionOptions = Omit<
  Omit<SuiSignAndExecuteTransactionBlockInput, "account" | "chain"> &
    Partial<SuiSignAndExecuteTransactionBlockInput>,
  "transactionBlock"
>;

export async function signAndExecuteTransactionBlock({
  client,
  currentWallet,
  currentAccount,
  transactionBlock,
  requestType,
  options,
  onTransactionSuccess,
  onTransactionError,
  ...signTransactionBlockArgs
}: {
  client: SuiClient;
  currentWallet: WalletWithRequiredFeatures | null;
  currentAccount: WalletAccount | null;
  onTransactionSuccess: (tx: SuiSignAndExecuteTransactionBlockOutput) => void;
  onTransactionError: (
    tx: SuiSignAndExecuteTransactionBlockOutput,
    error: string[]
  ) => void;
} & Omit<SuiSignAndExecuteTransactionBlockInput, "account" | "chain"> &
  Partial<SuiSignAndExecuteTransactionBlockInput>): Promise<SuiSignAndExecuteTransactionBlockOutput> {
  if (!currentWallet) {
    throw new Error("No wallet is connected.");
  }

  const signerAccount = signTransactionBlockArgs.account ?? currentAccount;
  if (!signerAccount) {
    throw new Error(
      "No wallet account is selected to sign and execute the transaction block with."
    );
  }

  const walletFeature =
    currentWallet.features["sui:signAndExecuteTransactionBlock"];
  let tx: SuiSignAndExecuteTransactionBlockOutput;
  if (walletFeature) {
    tx = await walletFeature.signAndExecuteTransactionBlock({
      transactionBlock,
      ...signTransactionBlockArgs,
      account: signerAccount,
      chain: signTransactionBlockArgs.chain ?? signerAccount.chains[0],
      requestType,
      options,
    });
  } else {
    const walletFeature = currentWallet.features["sui:signTransactionBlock"];
    if (!walletFeature) {
      throw new Error(
        "This wallet doesn't support the `signTransactionBlock` feature."
      );
    }

    const { signature, transactionBlockBytes } =
      await walletFeature.signTransactionBlock({
        transactionBlock,
        ...signTransactionBlockArgs,
        account: signerAccount,
        chain: signTransactionBlockArgs.chain ?? signerAccount.chains[0],
      });

    tx = await client.executeTransactionBlock({
      transactionBlock: transactionBlockBytes,
      signature,
      requestType,
      options,
    });
  }
  
  client.waitForTransactionBlock({ digest: tx.digest }).then((tx) => {
    if (tx.errors) {
      onTransactionError(tx, tx.errors);
    } else {
      onTransactionSuccess(tx);
    }
  });
  return tx;
}
