import { Container } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";

export const Route = createFileRoute(
  "/app/dominion/$dominionId/createProposal"
)({
  component: CreateProposal,
});

function CreateProposal() {
  return (
    <Container>
      <DominionHeader tab="createProposal" />
    </Container>
  );
}
