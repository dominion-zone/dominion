import { useCallback } from "react";
import { Network } from "../config/network";
import { Form, Formik } from "formik";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import useLockTokens from "../hooks/mutations/useLockTokens";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import coinBalanceQO from "../queryOptions/user/coinBalanceQO";
import dominionQO from "../queryOptions/dominionQO";
import { SnackbarKey, useSnackbar } from "notistack";
import { formatDigest } from "@mysten/sui.js/utils";

function LockTokensForm({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet: string;
}) {
  const currentAccount = useCurrentAccount();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let notification: SnackbarKey;

  const lockTokens = useLockTokens({
    network,
    dominionId,
    wallet,
    onSuccess({ tx }, { amount }) {
      notification = enqueueSnackbar(
        <Typography>
          Locking {amount.toString()} of ${governance.coinType} transaction was sent {" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "info",
        }
      );
    },
    onTransactionSuccess({ tx }, { amount }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Locking {amount.toString()} of ${governance.coinType} transaction
          successful{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "success",
        }
      );
    },
    onTransactionError({ tx }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Locking{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "error",
        }
      );
    },
  });

  const handleSubmit = useCallback(
    ({ amount }: { amount: string }) => {
      lockTokens.mutate({
        amount: BigInt(amount),
      });
    },
    [lockTokens]
  );
  const queryClient = useQueryClient();
  const {
    data: { governance },
  } = useSuspenseQuery(dominionQO({ network, dominionId, queryClient }));
  const {
    data: { totalBalance },
  } = useSuspenseQuery(
    coinBalanceQO({
      network,
      wallet,
      coinType: governance.coinType,
      queryClient,
    })
  );

  return (
    <Formik initialValues={{ amount: "" }} onSubmit={handleSubmit}>
      {({ values, handleChange, handleBlur, setFieldValue }) => (
        <Form>
          <div>
            <Typography variant="h6">Lock governance tokens</Typography>
          </div>
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              name="amount"
              label="Amount"
              value={values.amount}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Button
              onClick={() => setFieldValue("amount", totalBalance.toString())}
            >
              Max ({totalBalance})
            </Button>
          </Stack>
          <div>
            <Button
              type="submit"
              disabled={!currentAccount || lockTokens.isPending}
            >
              Lock
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default LockTokensForm;
