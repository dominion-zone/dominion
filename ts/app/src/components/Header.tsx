import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import { Link } from "@tanstack/react-router";

function AppHeader() {
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Button
            component={Link}
            to="/"
            color="inherit"
          >
            Dominion
          </Button>
          <Stack direction="row" sx={{ marginLeft: "auto" }}>
            <Button
              component={Link}
              to="/app"
              search={{ network: 'devnet' }} // TODO: save network in local storage
              color="inherit"
            >
              Launch App
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

export default AppHeader;
