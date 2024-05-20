import { Outlet, createFileRoute } from "@tanstack/react-router";
import proposalQO from "../../../queryOptions/proposalQO";
import dominionQO from "../../../queryOptions/dominionQO";
import governanceQO from "../../../queryOptions/governanceQO";

export const Route = createFileRoute("/app/proposal/$proposalId")({
  component: Outlet,
  loaderDeps: ({ search: { network } }) => ({ network }),
  loader: async ({
    deps: { network },
    context: { queryClient },
    params: { proposalId },
  }) => {
    const proposal = await queryClient.ensureQueryData(
      proposalQO({ network, queryClient, proposalId })
    );
    const governance = await queryClient.ensureQueryData(
      governanceQO({
        network,
        queryClient,
        governanceId: proposal.governanceId,
      })
    );
    await queryClient.ensureQueryData(
      dominionQO({ network, dominionId: governance.dominionId, queryClient })
    );
  },
});
