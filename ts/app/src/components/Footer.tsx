import { Paper, Toolbar, Link, Button, Stack, Typography } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import GitHubIcon from "@mui/icons-material/GitHub";

function Footer() {
  return (
    <>
      <Toolbar></Toolbar>
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100}}
        elevation={3}
      >
        <footer>
          <Toolbar>
            <Button
              component={Link}
              target="_blank"
              rel="noreferrer"
              href="https://github.com/dominion-zone/dominion"
            >
              <GitHubIcon />
            </Button>
            <Typography variant="caption" sx={{ marginLeft: "auto" }}>
              Copyright © 2024 Dominion
            </Typography>
            <Stack direction="row" sx={{ marginLeft: "auto" }}>
              <Button
                component={Link}
                target="_blank"
                rel="noreferrer"
                href="https://drive.google.com/file/d/1j-m_MKauqoPhhaiYv1zhKvCMj8D-j_9b/view"
              >
                <Typography sx={{ marginRight: 1 }}>Demo</Typography>
                <PlayCircleIcon />
              </Button>
            </Stack>
          </Toolbar>
        </footer>
      </Paper>
    </>
  );
}

export default Footer;
