import {
  Container,
  Dialog,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { Network } from "../../config/network";
import { Action } from "../../types/actions";
import { useEffect, useState } from "react";
import ActionEditor from "./ActionEditor";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

function ActionCreator({
  network,
  createAction,
}: {
  network: Network;
  createAction: (action: Action) => void;
}) {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "enableCommander" | "disableCommander" | "transferCoin"
  >("transferCoin");

  const [action, setAction] = useState<Action>({
    type: "transferCoin",
    coinType: "0x2::sui::SUI",
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
          coinType: "0x2::sui::SUI",
          recipient: "",
          amount: "0",
        });
    }
  }, [actionType]);

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <AddCircleOutlineIcon />
      </IconButton>

      <Dialog open={open}>
        <Container>
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
              setAction={(action) => {
                createAction(action);
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            />
          </FormControl>
        </Container>
      </Dialog>
    </>
  );
}

export default ActionCreator;
