import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import CoinTypeSelector from "./CoinTypeSelector";
import { Network } from "../config/network";
import { Formik, Form, FormikHelpers, FormikHandlers } from "formik";
import { useCurrentAccount } from "@mysten/dapp-kit";
import useDepositToDominion from "../hooks/mutations/useDepositToDominion";
import { SnackbarKey, useSnackbar } from "notistack";
import { Link } from "@mui/material";
import { formatDigest } from "@mysten/sui.js/utils";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import coinBalanceQO from "../queryOptions/user/coinBalanceQO";
import { SUI_COIN_TYPE } from "../consts";

function DepositTokenToDominionForm({
  network,
  wallet,
  disabled,
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  setOpen,
}: {
  network: Network;
  wallet: string;
  disabled: boolean;
  values: { coinType: string; amount: string };
  setOpen: (value: boolean) => void;
} & FormikHelpers<{ coinType: string; amount: string }> &
  FormikHandlers) {
  const queryClient = useQueryClient();
  const {
    data: { totalBalance },
  } = useSuspenseQuery(
    coinBalanceQO({
      network,
      wallet,
      coinType: values.coinType,
      queryClient,
    })
  );
  return (
    <Form>
      <DialogContent>
        <div>
          <CoinTypeSelector
            network={network}
            wallet={wallet}
            value={values.coinType}
            onChange={(value) => setFieldValue("coinType", value || "")}
          />
        </div>
        <br/>
        <Stack direction="row" spacing={1}>
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
            Max ({totalBalance.toString()})
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="submit" disabled={disabled}>
          Deposit
        </Button>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
      </DialogActions>
    </Form>
  );
}

function DepositTokenToDominionButton({
  network,
  wallet,
  dominionId,
  disabled = false,
}: {
  network: Network;
  wallet: string;
  dominionId: string;
  disabled?: boolean;
}) {
  const currentAccount = useCurrentAccount();

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let notification: SnackbarKey;

  const deposit = useDepositToDominion({
    network,
    dominionId,
    wallet,
    onSuccess({ tx }, { coinType, amount }) {
      notification = enqueueSnackbar(
        <Typography>
          Depositing {amount.toString()} of {coinType} transaction was sent{" "}
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
    onTransactionSuccess({ tx }, { coinType, amount }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Depositing {amount.toString()} of {coinType} transaction successful{" "}
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
          Depositing failed{" "}
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
    (params: { coinType: string; amount: string }) => {
      deposit.mutate(
        {
          ...params,
          amount: BigInt(params.amount),
        },
        {
          onSettled: () => setOpen(false),
        }
      );
    },
    [deposit]
  );

  return (
    <>
      <Dialog open={open} maxWidth='lg'>
        <DialogTitle>Deposit to dominion</DialogTitle>
        <Formik
          initialValues={{ coinType: SUI_COIN_TYPE, amount: "0" }}
          onSubmit={handleSubmit}
        >
          {(params) => (
            <DepositTokenToDominionForm
              network={network}
              wallet={wallet}
              disabled={disabled || !currentAccount || deposit.isPending}
              setOpen={setOpen}
              {...params}
            />
          )}
        </Formik>
      </Dialog>
      <Button disabled={disabled || !currentAccount} onClick={handleClickOpen}>
        Deposit
      </Button>
    </>
  );
}

export default DepositTokenToDominionButton;
