import { ConnectButton } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { AppBar, Toolbar, Stack } from "@mui/material";
import NetworkSelector from "./NetworkSelector";
import HomeLink from "./HomeLink";

function AppHeader() {
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <HomeLink />
          <Stack direction="row" sx={{ marginLeft: "auto" }}>
            <NetworkSelector sx={{mr: 2}}/>
            <ConnectButton />
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

export default AppHeader;
