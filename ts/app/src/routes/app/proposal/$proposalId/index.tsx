import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import proposalQO from "../../../../queryOptions/proposalQO";
import { Card, Container, List, ListItem, Typography } from "@mui/material";
import userMembersQO from "../../../../queryOptions/user/userMembersQO";
import ProposalVoting from "../../../../components/ProposalVoting";
import proposalStatusQO from "../../../../queryOptions/proposalStatusQO";
import ProposalHeader from "../../../../components/ProposalHeader";
import ActionInfo from "../../../../components/actions/ActionInfo";
import { Action } from "../../../../types/actions";

export const Route = createFileRoute("/app/proposal/$proposalId/")({
  component: ProposalInfo,
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: async ({
    deps: { network, wallet },
    context: { queryClient },
    params: { proposalId },
  }) => {
    if (wallet) {
      await queryClient.ensureQueryData(
        userMembersQO({ network, queryClient, wallet })
      );
    }
    await queryClient.ensureQueryData(
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

  const { data: status } = useSuspenseQuery(
    proposalStatusQO({ network, proposalId, queryClient })
  );

  return (
    <Container>
      <ProposalHeader tab="info" />
      <Card>
        <Typography>Status: {status}</Typography>
        <Typography>Actions</Typography>
        <List>
          {proposal.options[0].commands.map((command, i) => (
            <ListItem key={i}>
              <ActionInfo action={command.action as Action} />
            </ListItem>
          ))}
        </List>
        {wallet && (
          <ProposalVoting
            proposal={proposal}
            disabled={status !== "voting" && status !== "coolingOff"}
          />
        )}
      </Card>
    </Container>
  );
}
