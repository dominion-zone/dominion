import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Network } from "../config/network";
import useSuspenseMember from "../hooks/queries/useSuspenseMember";
import { Form, Formik } from "formik";
import useUnlockTokens from "../hooks/mutations/useUnlockTokens";
import { useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SnackbarKey, useSnackbar } from "notistack";
import { formatDigest } from "@mysten/sui.js/utils";
import useSuspenseDominion from "../hooks/queries/useSuspenseDominion";

function MemberInfo({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet: string;
}) {
  const currentAccount = useCurrentAccount();
  const member = useSuspenseMember({ network, dominionId, wallet });
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { governance } = useSuspenseDominion({ network, dominionId });
  let notification: SnackbarKey;

  const unlockTokens = useUnlockTokens({
    network,
    dominionId,
    wallet,
    onSuccess({ tx }, { amount }) {
      notification = enqueueSnackbar(
        <Typography>
          Unlocking {amount.toString()} of {governance.coinType} transaction
          was sent{" "}
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
          Unlocking {amount.toString()} of {governance.coinType} transaction
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
          Unlocking failed{" "}
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
      unlockTokens.mutate({
        amount: BigInt(amount),
      });
    },
    [unlockTokens]
  );

  if (!member) {
    return <Typography>Not a member</Typography>;
  }
  return (
    <div>
      <Typography>Voting power: {member.balance.toString()}</Typography>
      <br />
      <Formik
        initialValues={{ amount: member.balance.toString() }}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <Stack direction="row">
              <TextField
                type="number"
                name="amount"
                label="Amount"
                value={values.amount}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <Button onClick={() => setFieldValue("amount", member.balance.toString())}>
                Max ({member.balance.toString()})
              </Button>
            </Stack>
            <div>
              <Button
                type="submit"
                disabled={!currentAccount || unlockTokens.isPending}
              >
                Withdraw
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default MemberInfo;
