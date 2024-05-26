import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import proposalQO from "../../../../queryOptions/proposalQO";
import { Container, List, ListItem, Typography } from "@mui/material";
import governanceQO from "../../../../queryOptions/governanceQO";
import dominionQO from "../../../../queryOptions/dominionQO";
import userMembersQO from "../../../../queryOptions/user/userMembersQO";
import ProposalVoting from "../../../../components/ProposalVoting";
import proposalStatusQO from "../../../../queryOptions/proposalStatusQO";

export const Route = createFileRoute("/app/proposal/$proposalId/")({
  component: ProposalInfo,
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: async ({
    deps: { network, wallet },
    context: { queryClient },
    params: { proposalId },
  }) => {
    if (wallet) {
      queryClient.ensureQueryData(
        userMembersQO({ network, queryClient, wallet })
      );
    }
    queryClient.ensureQueryData(
      proposalStatusQO({ network, queryClient, proposalId })
    );
  },
});

function ProposalInfo() {
  const { network, wallet } = Route.useSearch();
  const { proposalId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: proposal } = useSuspenseQuery(
    proposalQO({ network, proposalId, queryClient })
  );

  const { data: governance } = useSuspenseQuery(
    governanceQO({ network, governanceId: proposal.governanceId, queryClient })
  );

  const {
    data: { urlName, dominion },
  } = useSuspenseQuery(
    dominionQO({ network, dominionId: governance.dominionId, queryClient })
  );

  const { data: status } = useSuspenseQuery(
    proposalStatusQO({ network, proposalId, queryClient })
  );

  return (
    <Container>
      <Typography>Proposal</Typography>
      <Link to={proposal.link}>
        <Typography>{proposal.name}</Typography>
      </Link>
      <Typography>From dominion</Typography>
      <Link
        to="/app/dominion/$dominionId"
        params={{ dominionId: urlName || dominion.id }}
        search={{ network, wallet }}
      >
        <Typography>{governance.name}</Typography>
      </Link>
      <Typography>Status: {status}</Typography>
      <Typography>Actions</Typography>
      <List>
        {proposal.options[0].commands.map((command, i) => (
          <ListItem key={i}>
            {JSON.stringify(command.action, (_key, value) =>
              typeof value === "bigint" ? value.toString() : value
            )}
          </ListItem>
        ))}
      </List>
      {wallet && (
        <ProposalVoting
          proposal={proposal}
          disabled={status !== "voting" && status !== "coolingOff"}
        />
      )}
    </Container>
  );
}
