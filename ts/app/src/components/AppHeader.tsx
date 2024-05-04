import {
  ConnectButton,
  useCurrentAccount,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import NetworkSelector from "./NetworkSelector";
import { Link } from "@tanstack/react-router";
import { Network } from "../config/network";

function AppHeader() {
  const { network } = useSuiClientContext();
  const wallet = useCurrentAccount();
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Button component={Link} to="/" color="inherit">
            Dominion
          </Button>
          <Stack direction="row" sx={{ margin: "auto" }}>
            <Button
              component={Link}
              to="/app/create"
              search={{ network: network as Network, wallet: wallet?.address }}
              color="inherit"
              disabled={!wallet}
            >
              Create
            </Button>
          </Stack>
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
