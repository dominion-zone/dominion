import { useMemo } from "react";
import { Network } from "../../../config/network";
import useSuspenseConfig from "../../../hooks/useSuspenseConfig";
import { Action, ToggleCommanderAction } from "../../../types/actions";
import { Form, Formik } from "formik";
import {
  Autocomplete,
  Button,
  DialogActions,
  TextField,
} from "@mui/material";

function ToggleCommanderActionEditor({
  network,
  action,
  setAction,
  onCancel,
}: {
  network: Network;
  action: ToggleCommanderAction;
  setAction: (action: Action) => void;
  onCancel: () => void;
}) {
  const config = useSuspenseConfig({ network });
  const commanders = useMemo(
    () => [
      `${config.frameworkCommander.contract}::coin_commander::CoinCommander`,
      `${config.dominion.contract}::dominion_admin_commander::DominionAdminCommander`,
      `${config.governance.contract}::governance_admin_commander::GovernanceAdminCommander`,
    ],
    [
      config.dominion.contract,
      config.frameworkCommander.contract,
      config.governance.contract,
    ]
  );
  return (
    <Formik
      initialValues={{ commander: action.commander }}
      onSubmit={({ commander }) => {
        setAction({ ...action, commander });
      }}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <div>
            <Autocomplete
              sx={{ minWidth: "65em" }}
              freeSolo={true}
              options={commanders}
              renderInput={(params) => (
                <TextField name="commander" label="Commander" {...params} />
              )}
              value={values.commander}
              onChange={(_e, value) => setFieldValue("commander", value || "")}
            />
          </div>
          <br />
          <DialogActions>
            <Button type="submit">Save</Button>
            <Button onClick={onCancel}>Cancel</Button>
          </DialogActions>
        </Form>
      )}
    </Formik>
  );
}

export default ToggleCommanderActionEditor;
