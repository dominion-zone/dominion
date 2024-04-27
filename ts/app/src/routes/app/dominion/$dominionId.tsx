import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dominion/$dominionId")({
  component: Show,
});

function Show() {
  return <h1>Show</h1>;
}
