import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { useCallback } from "react";

function NetworkSelector() {
  const { network, selectNetwork } = useSuiClientContext();

  const handleSelectNetwork = useCallback(
    (event: SelectChangeEvent) => {
      selectNetwork(event.target.value);
    },
    [selectNetwork]
  );
  return (
    <FormControl variant="standard">
      <InputLabel id="network-select-label">Network</InputLabel>
      <Select
        labelId="network-select-label"
        value={network}
        onChange={handleSelectNetwork}
      >
        <MenuItem value="devnet">Devnet</MenuItem>
        <MenuItem value="testnet">Testnet</MenuItem>
        <MenuItem value="mainnet">Mainnet</MenuItem>
      </Select>
    </FormControl>
  );
}

export default NetworkSelector;
