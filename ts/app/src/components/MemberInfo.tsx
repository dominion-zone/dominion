import { Button, TextField, Typography } from "@mui/material";
import { Network } from "../config/network";
import useSuspenseMember from "../hooks/queries/useSuspenseMember";
import { Form, Formik } from "formik";
import useWithdraw from "../hooks/mutations/useWithdraw";
import { useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

function MemberInfo({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const currentAccount = useCurrentAccount();
  const member = useSuspenseMember({ network, dominionId, wallet });
  const withdraw = useWithdraw({ network, dominionId, wallet });
  const handleSubmit = useCallback(
    ({ amount }: { amount: string }) => {
      withdraw.mutate({
        amount: BigInt(amount),
      });
    },
    [withdraw]
  );

  if (!member) {
    return <Typography variant="h4">Not a member</Typography>;
  }
  return (
    <div>
      <Typography variant="h4">Voting power: {member.balance}</Typography>
      <Formik
        initialValues={{ amount: member.balance.toString() }}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleBlur }) => (
          <Form>
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
              <Button type="submit" disabled={!currentAccount || withdraw.isPending}>
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
