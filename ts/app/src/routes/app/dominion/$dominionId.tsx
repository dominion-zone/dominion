import { Outlet, createFileRoute } from "@tanstack/react-router";
import dominionQO from "../../../queryOptions/dominionQO";

export const Route = createFileRoute("/app/dominion/$dominionId")({
  component: Outlet,
  loaderDeps: ({ search: { network } }) => ({ network }),
  loader: ({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) =>
    queryClient.ensureQueryData(
      dominionQO({ network, queryClient, dominionId })
    ),
});
