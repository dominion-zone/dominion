import { Container, List, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import dominionProposalsQO from "../../../../queryOptions/dominionProposalsQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import ProposalListItem from "../../../../components/ProposalListItem";

export const Route = createFileRoute("/app/dominion/$dominionId/proposals")({
  component: Proposals,
  loaderDeps: ({ search: { network } }) => ({ network }),
  loader: ({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) =>
    queryClient.ensureQueryData(
      dominionProposalsQO({ network, queryClient, dominionId })
    ),
});

function Proposals() {
  const { network } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: proposals } = useSuspenseQuery(
    dominionProposalsQO({ network, queryClient, dominionId })
  );
  return (
    <Container>
      <DominionHeader tab="proposals" />
      {proposals.length === 0 && <Typography>No proposals</Typography>}
      <List>
        {proposals.map((proposal) => (
          <ProposalListItem key={proposal.id} proposal={proposal} />
        ))}
      </List>
    </Container>
  );
}
