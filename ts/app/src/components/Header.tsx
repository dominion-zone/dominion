import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import { Link } from "@tanstack/react-router";
import HomeLink from "./HomeLink";

function AppHeader() {
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <HomeLink/>
          <Stack direction="row" sx={{ marginLeft: "auto" }}>
            <Button
              component={Link}
              to="/app"
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
