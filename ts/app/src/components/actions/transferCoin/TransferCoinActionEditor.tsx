import { useParams, useSearch } from "@tanstack/react-router";
import { Action, TransferCoinAction } from "../../../types/actions";
import { Form, Formik } from "formik";
import { Button, TextField, Typography } from "@mui/material";
import useSuspenseDominion from "../../../hooks/queries/useSuspenseDominion";
import CoinTypeSelector from "../../CoinTypeSelector";
import { SUI_COIN_TYPE } from "../../../consts";

function TransferCoinActionEditor({
  action,
  setAction,
  onCancel,
}: {
  action: TransferCoinAction;
  setAction: (action: Action) => void;
  onCancel: () => void;
}) {
  const { network } = useSearch({ from: "/app" });
  const { dominionId } = useParams({ from: "/app/dominion/$dominionId" });
  const { dominion } = useSuspenseDominion({ network, dominionId });

  return (
    <Formik
      initialValues={{
        coinType: SUI_COIN_TYPE,
        recipient: action.recipient,
        amount: action.amount,
      }}
      onSubmit={({ recipient, amount, coinType }) => {
        setAction({ ...action, recipient, amount, coinType });
      }}
    >
      {({ values, handleChange, handleBlur, setFieldValue }) => (
        <Form>
          <Typography>{action.type}</Typography>
          <div>
            <CoinTypeSelector
              network={network}
              wallet={dominion.id}
              value={values.coinType}
              onChange={(v) => setFieldValue("coinType", v)}
            />
          </div>
          <div>
            <TextField
              name="recipient"
              label="Recipient"
              value={values.recipient}
              onChange={handleChange}
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
          <Button type="submit">Save</Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Form>
      )}
    </Formik>
  );
}

export default TransferCoinActionEditor;
