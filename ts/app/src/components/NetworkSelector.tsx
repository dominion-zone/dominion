import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  SxProps,
  Theme
} from "@mui/material";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { configQO } from "../queryOptions/configQO";

export type NetworkSelectorProps = {
  sx?: SxProps<Theme>;
}

function NetworkSelector({sx = []}: NetworkSelectorProps) {
  const { data: config } = useSuspenseQuery(configQO());
  const { network, selectNetwork } = useSuiClientContext();

  const networks = Object.keys(config);

  const handleSelectNetwork = useCallback(
    (event: SelectChangeEvent) => {
      selectNetwork(event.target.value);
    },
    [selectNetwork]
  );
  return (
    <FormControl variant="standard" sx={sx}>
      <InputLabel id="network-select-label">Network</InputLabel>
      <Select
        labelId="network-select-label"
        value={network}
        onChange={handleSelectNetwork}
      >
        {networks.map((network) => (
          <MenuItem key={network} value={network}>
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default NetworkSelector;
