import { Button, Dialog, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import CoinTypeSelector from "./CoinTypeSelector";
import { Network } from "../config/network";
import { Formik, Form } from "formik";
import { useCurrentAccount } from "@mysten/dapp-kit";
import useDepositToDominion from "../hooks/mutations/useDepositToDominion";

function DepositTokenToDominionButton({
  network,
  wallet,
  dominionId,
  disabled = false,
}: {
  network: Network;
  wallet?: string;
  dominionId: string;
  disabled?: boolean;
}) {
  const currentAccount = useCurrentAccount();

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const deposit = useDepositToDominion({ network, dominionId });

  const handleSubmit = useCallback(
    (params: { coinType: string; amount: string }) => {
      deposit.mutate(
        {
          ...params,
          amount: BigInt(params.amount),
          wallet: currentAccount!.address,
        },
        {
          onSettled: () => setOpen(false),
        }
      );
    },
    [currentAccount, deposit]
  );

  return (
    <>
      {wallet && (
        <Dialog open={open}>
          <Formik
            initialValues={{ coinType: "0x2::sui::SUI", amount: "" }}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, handleBlur, setFieldValue }) => (
              <Form>
                <div>
                  <CoinTypeSelector
                    network={network}
                    wallet={wallet}
                    value={values.coinType}
                    onChange={(value) => setFieldValue("coinType", value || "")}
                  />
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
                    disabled={
                      disabled ||
                      !wallet ||
                      !currentAccount ||
                      deposit.isPending
                    }
                  >
                    Deposit
                  </Button>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </Form>
            )}
          </Formik>
        </Dialog>
      )}
      <Button
        disabled={disabled || !wallet || !currentAccount}
        onClick={handleClickOpen}
      >
        Deposit
      </Button>
    </>
  );
}

export default DepositTokenToDominionButton;
