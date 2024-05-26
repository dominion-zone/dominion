import { Button, TextField, Typography } from "@mui/material";
import { Formik, Form } from "formik";
import { useCallback } from "react";
import useAirdrop from "../hooks/mutations/useAirdrop";
import { Network } from "../config/network";
import { useCurrentAccount } from "@mysten/dapp-kit";

function AirdropForm({
  network,
  wallet,
}: {
  network: Network;
  wallet?: string;
}) {
  const currentAccount = useCurrentAccount();
  const airdrop = useAirdrop({ network });
  const handleSubmit = useCallback(
    ({ amount }: { amount: string }) => {
      airdrop.mutate({
        wallet: wallet!,
        amount: BigInt(amount),
      });
    },
    [airdrop, wallet]
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
            <Button type="submit" disabled={!currentAccount || airdrop.isPending}>
              Airdrop
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default AirdropForm;
