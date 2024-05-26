import { useCallback } from "react";
import { Network } from "../config/network";
import { Form, Formik } from "formik";
import { Button, TextField, Typography } from "@mui/material";
import useLockTokens from "../hooks/mutations/useLockTokens";
import { useCurrentAccount } from "@mysten/dapp-kit";

function LockTokensForm({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const currentAccount = useCurrentAccount();
  const lockTokens = useLockTokens({ network, dominionId, wallet });
  const handleSubmit = useCallback(
    ({ amount }: { amount: string }) => {
      lockTokens.mutate({
        amount: BigInt(amount),
      });
    },
    [lockTokens]
  );
  return (
    <Formik initialValues={{ amount: "" }} onSubmit={handleSubmit}>
      {({ values, handleChange, handleBlur }) => (
        <Form>
          <div>
            <Typography variant="h6">Lock tokens</Typography>
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
            <Button type="submit" disabled={!currentAccount || lockTokens.isPending}>
              Lock
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default LockTokensForm;