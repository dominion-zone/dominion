import { Network } from "../../config/network";
import { Action } from "../../types/actions";
import ToggleCommanderActionEditor from "./toggleCommander/ToggleCommanderActionEditor";
import TransferCoinActionEditor from "./transferCoin/TransferCoinActionEditor";

function ActionEditor({
  network,
  action,
  setAction,
  onCancel,
}: {
  network: Network;
  action: Action;
  setAction: (action: Action) => void;
  onCancel: () => void;
}) {
  switch (action.type) {
    case "enableCommander":
    case "disableCommander":
      return (
        <ToggleCommanderActionEditor
          network={network}
          action={action}
          setAction={setAction}
          onCancel={onCancel}
        />
      );
    case "transferCoin":
      return (
        <TransferCoinActionEditor
          action={action}
          setAction={setAction}
          onCancel={onCancel}
        />
      );
  }
}

export default ActionEditor;
