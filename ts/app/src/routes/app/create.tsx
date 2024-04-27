import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/create")({
  component: Create,
});

function Create() {
  return <h1>Create</h1>;
}
