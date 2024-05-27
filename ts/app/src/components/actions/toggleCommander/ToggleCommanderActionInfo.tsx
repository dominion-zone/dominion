import { Card, Typography } from "@mui/material";

export type ToggleCommanderActionInfoProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any;
};

function ToggleCommanderActionInfo({ action }: ToggleCommanderActionInfoProps) {
  return (
    <Card>
      <Typography>{action.type === 'enableCommander' ? 'Enable': 'Disable'} {action.commander}</Typography>
    </Card>
  );
}

export default ToggleCommanderActionInfo;
