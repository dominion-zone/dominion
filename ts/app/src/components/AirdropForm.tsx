import { Button, Link, TextField, Typography } from "@mui/material";
import { Formik, Form } from "formik";
import { useCallback } from "react";
import useAirdrop from "../hooks/mutations/useAirdrop";
import { Network } from "../config/network";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SnackbarKey, useSnackbar } from "notistack";
import { formatDigest } from "@mysten/sui.js/utils";

function AirdropForm({
  network,
  wallet,
}: {
  network: Network;
  wallet: string;
}) {
  const currentAccount = useCurrentAccount();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let notification: SnackbarKey;

  const airdrop = useAirdrop({
    network,
    wallet,
    onSuccess({ tx }, { amount }) {
      notification = enqueueSnackbar(
        <Typography>
          Airdrop of {amount.toString()} test tokens transaction was sent {" "}
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
            Airdrop of {amount.toString()} test tokens transaction successful {" "}
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
    onTransactionError({tx}) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Airdrop failed {" "}
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
      airdrop.mutate({
        amount: BigInt(amount),
      });
    },
    [airdrop]
  );
  return (
    <Formik initialValues={{ amount: "1000000000" }} onSubmit={handleSubmit}>
      {({ values, handleChange, handleBlur }) => (
        <Form>
          <div>
            <Typography variant="h6">Airdrop test tokens</Typography>
          </div>
          <div>
            <TextField
              type="number"
              name="amount"
              label="Amount"
              value={values.amount}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <Button
              type="submit"
              disabled={!currentAccount || airdrop.isPending}
            >
              Airdrop
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default AirdropForm;
