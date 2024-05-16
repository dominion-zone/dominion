import {
  IconButton,
  Card,
  List,
  ListItem,
  Typography,
  TextField,
  Button,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Autocomplete,
} from "@mui/material";
import { Action } from "../queryOptions/proposalQO";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import { Formik, Form } from "formik";
import { useEffect, useMemo, useState } from "react";
import useConfig from "../hooks/useConfig";
import { Network } from "../config/network";

export type ProposalActionsEditorProps = {
  network: Network;
  actions: Action[];
  setActions: (actions: Action[]) => void;
};

function ToggleCommanderActionEditor({
  network,
  action,
  setAction,
}: {
  network: Network;
  action:
    | {
        type: "enableCommander";
        commander: string;
      }
    | {
        type: "disableCommander";
        commander: string;
      };
  setAction: (action: Action) => void;
}) {
  const config = useConfig({ network });
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
          <Typography>{action.type}</Typography>
          <div>
            <Autocomplete
              sx={{ width: 1000 }}
              freeSolo={true}
              options={commanders}
              renderInput={(params) => (
                <TextField name="commander" label="Commander" {...params} />
              )}
              value={values.commander}
              onChange={(e, value) => setFieldValue("commander", value || "")}
            />
          </div>
          <Button type="submit">Save</Button>
        </Form>
      )}
    </Formik>
  );
}

function TransferCoinActionEditor({
  action,
  setAction,
}: {
  action: {
    type: 'transferCoin';
    recipient: string;
    amount: string;
  };
  setAction: (action: Action) => void;
}) {
  return (
    <Formik
      initialValues={{
        recipient: action.recipient,
        amount: action.amount,
      }}
      onSubmit={({ recipient, amount }) => {
        setAction({ ...action, recipient, amount });
      }}
    >
      {({ values, handleChange, handleBlur }) => (
        <Form>
          <Typography>{action.type}</Typography>
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
        </Form>
      )}
    </Formik>
  );
}

function ActionEditor({
  network,
  action,
  setAction,
}: {
  network: Network;
  action: Action;
  setAction: (action: Action) => void;
}) {
  switch (action.type) {
    case "enableCommander":
    case "disableCommander":
      return (
        <ToggleCommanderActionEditor
          network={network}
          action={action}
          setAction={setAction}
        />
      );
    case "transferCoin":
      return <TransferCoinActionEditor action={action} setAction={setAction} />;
  }
}

function ActionCreator({
  network,
  open,
  createAction,
}: {
  network: Network;
  open: boolean;
  createAction: (action: Action) => void;
}) {
  const [actionType, setActionType] = useState<
    "enableCommander" | "disableCommander" | "transferCoin"
  >("transferCoin");

  const [action, setAction] = useState<Action>({
    type: "transferCoin",
    recipient: "",
    amount: "0",
  });

  useEffect(() => {
    switch (actionType) {
      case "enableCommander":
      case "disableCommander":
        setAction({
          type: actionType,
          commander: "",
        });
        break;
      case "transferCoin":
        setAction({
          type: actionType,
          recipient: "",
          amount: "0",
        });
    }
  }, [actionType]);

  return (
    <Dialog open={open}>
      <Typography>Create Action</Typography>
      <FormControl fullWidth>
        <InputLabel id="action-type-selector-label">Action type</InputLabel>
        <Select
          labelId="action-type-selector-label"
          id="action-type-selector"
          value={actionType}
          label="Action type"
          onChange={(event: SelectChangeEvent) =>
            setActionType(
              event.target.value as
                | "enableCommander"
                | "disableCommander"
                | "transferCoin"
            )
          }
        >
          <MenuItem value="enableCommander">Enable commander</MenuItem>
          <MenuItem value="disableCommander">Disable commander</MenuItem>
          <MenuItem value="transferCoin">Transfer coin</MenuItem>
        </Select>
        <ActionEditor
          network={network}
          action={action}
          setAction={createAction}
        />
      </FormControl>
    </Dialog>
  );
}

function ProposalActionItem({
  network,
  action,
  setAction,
  deleteAction,
}: {
  network: Network;
  action: Action;
  setAction: (action: Action) => void;
  deleteAction: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ListItem>
      <Dialog open={open}>
        <ActionEditor
          network={network}
          action={action}
          setAction={(action) => {
            setAction(action);
            setOpen(false);
          }}
        />
      </Dialog>
      {JSON.stringify(action, undefined, 2)}
      <IconButton onClick={() => setOpen(true)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={deleteAction}>
        <RemoveCircleOutlineIcon />
      </IconButton>
    </ListItem>
  );
}

function ProposalActionsEditor({
  network,
  actions,
  setActions,
}: ProposalActionsEditorProps) {
  const [creatorOpen, setCreatorOpen] = useState(false);

  return (
    <Card>
      <ActionCreator
        network={network}
        open={creatorOpen}
        createAction={(action) => {
          actions.push(action);
          setActions(actions);
          setCreatorOpen(false);
        }}
      />
      <Typography>Actions</Typography>
      <List>
        {actions.map((action, i) => (
          <ProposalActionItem
            key={i}
            network={network}
            action={action}
            setAction={(action) => {
              actions[i] = action;
              setActions(actions);
            }}
            deleteAction={() => {
              actions.splice(i, 1);
              setActions(actions);
            }}
          />
        ))}
      </List>
      <IconButton onClick={() => setCreatorOpen(true)}>
        <AddCircleOutlineIcon />
      </IconButton>
    </Card>
  );
}

export default ProposalActionsEditor;
