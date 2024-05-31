import { Container, List, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import dominionProposalsQO from "../../../../queryOptions/dominionProposalsQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import ProposalListItem from "../../../../components/ProposalListItem";
import useSuspenseDominion from "../../../../hooks/queries/useSuspenseDominion";
import { registryQO } from "../../../../queryOptions/registryQO";

export const Route = createFileRoute("/app/dominion/$dominionId/proposals")({
  component: Proposals,
  loaderDeps: ({ search: { network } }) => ({ network }),
  async loader({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) {
    const registry = await queryClient.ensureQueryData(
      registryQO({ network, queryClient })
    );
    if (!dominionId.startsWith("0x")) {
      const id = registry.findDominionId(dominionId);
      if (!id) {
        throw new Error(`Dominion url name not found: ${dominionId}`);
      }
      dominionId = id;
    }

    await queryClient.ensureQueryData(
      dominionProposalsQO({ network, queryClient, dominionId })
    );
  },
});

function Proposals() {
  const { network } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();

  const { dominion } = useSuspenseDominion({ network, dominionId });
  const { data: proposals } = useSuspenseQuery(
    dominionProposalsQO({ network, queryClient, dominionId: dominion.id })
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
