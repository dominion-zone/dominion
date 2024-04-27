import { Button } from "@mui/material";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Network } from "../app";

export const Route = createFileRoute("/app/")({
  component: Index,
});

function Index() {
  const { network } = useSuiClientContext();
  return (
    <Button
      component={Link}
      to="/app/create"
      search={{ network: network as Network }}
    >
      Create
    </Button>
  );
}
