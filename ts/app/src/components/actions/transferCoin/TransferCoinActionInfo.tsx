import { Card, Typography } from "@mui/material";
import { TransferCoinAction } from "@dominion.zone/dominion-sdk";

export type TransferCoinActionInfoProps = {
  action: TransferCoinAction;
};

function TransferCoinActionInfo({ action }: TransferCoinActionInfoProps) {
  return (
    <Card sx={{padding: 1}}>
      <Typography variant="h6">Transfer Coin</Typography>
      <Typography>Type: {action.coinType}</Typography>
      <Typography>Amount: {action.amount.toString()}</Typography>
      <Typography>Recipient: {action.recipient}</Typography>
    </Card>
  );
}

export default TransferCoinActionInfo;
