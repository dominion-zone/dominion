import { ConnectButton, useSuiClientContext } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import NetworkSelector from "./NetworkSelector";
import { Link } from "@tanstack/react-router";
import { Network } from "../routes/app";

function AppHeader() {
  const { network } = useSuiClientContext();
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Button
            component={Link}
            to="/app"
            search={{ network: network as Network }}
            color="inherit"
          >
            Dominion
          </Button>
          <Stack direction="row" sx={{ marginLeft: "auto" }}>
            <NetworkSelector />
            <ConnectButton />
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

export default AppHeader;
