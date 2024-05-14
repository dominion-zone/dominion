import { createFileRoute } from "@tanstack/react-router";
import dominionQO from "../../../queryOptions/dominionQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/dominion/$dominionId")({
  component: Show,
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

function Show() {
  const { network } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: { dominion, governance },
  } = useSuspenseQuery(dominionQO({ network, queryClient, dominionId }));
  return (
    <h1>
      {dominion.id} {governance.name}
    </h1>
  );
}
