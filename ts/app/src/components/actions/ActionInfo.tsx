import { Card } from "@mui/material";
import TransferCoinActionInfo from "./transferCoin/TransferCoinActionInfo";
import { TransferCoinAction } from "@dominion.zone/dominion-sdk";
import ToggleCommanderActionInfo from "./toggleCommander/ToggleCommanderActionInfo";

export type ActionInfoProps = {
  action: unknown;
};

function ActionInfo({ action }: ActionInfoProps) {
  switch ((action as { type: string }).type) {
    case "transferCoin":
      return <TransferCoinActionInfo action={action as TransferCoinAction} />;
    case "enableCommander":
    case "disableCommander":
      return <ToggleCommanderActionInfo action={action} />;
    default:
      return (
        <Card>
          {JSON.stringify(action, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value
          )}
        </Card>
      );
  }
}

export default ActionInfo;
