import {
  IconButton,
  Card,
  List,
  ListItem,
  Typography,
  Dialog,
  DialogTitle,
} from "@mui/material";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import { Network } from "../config/network";
import { Action } from "../types/actions";
import ActionEditor from "./actions/ActionEditor";
import ActionCreator from "./actions/ActionCreator";
import ActionInfo from "./actions/ActionInfo";

export type ProposalActionsEditorProps = {
  network: Network;
  actions: Action[];
  setActions: (actions: Action[]) => void;
};

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
      <Dialog open={open} maxWidth="lg">
        <DialogTitle>Edit {action.type} Action</DialogTitle>
        <ActionEditor
          network={network}
          action={action}
          setAction={(action) => {
            setAction(action);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
      <ActionInfo action={action} />
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
  return (
    <Card>
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
      <ActionCreator
        network={network}
        createAction={(action) => {
          actions.push(action);
          setActions(actions);
        }}
      />
    </Card>
  );
}

export default ProposalActionsEditor;
