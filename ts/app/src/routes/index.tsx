import { createFileRoute } from "@tanstack/react-router";
import Header from "../components/Header";
import { Box, Stack, Typography } from "@mui/material";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Header />
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex="1"
        p={2}
      >
        <Stack direction="column" spacing={2}>
          <Typography align="center" variant="body1">
            A DAO governance platform on the <strong>Sui blockchain</strong>{" "}
            that enables communities to manage assets like tokens and contract
            upgrade capabilities, allowing for the creation of plugins to
            execute functions from independently developed contracts and to
            implement various voting mechanisms.
          </Typography>
          <Typography align="center" variant="body1">
            Currently in beta, you have the opportunity to test drive its
            features and contribute to its ongoing enhancement.
          </Typography>
        </Stack>
      </Box>
    </>
  );
}
