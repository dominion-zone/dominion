import { Container } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import userDominionsQO from "../../queryOptions/user/userDominionsQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
  validateSearch: z.object({
    wallet: z.string().optional(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      userDominionsQO({ network, wallet, queryClient })
    ),
});

function AppIndex() {
  const {network, wallet} = Route.useSearch();

  const queryClient = useQueryClient();

  const { data: dominions } = useSuspenseQuery(
    userDominionsQO({
      network,
      wallet,
      queryClient,
    })
  );

  if (!wallet) {
    return <Container>Please connect wallet to list your dominions</Container>;
  }

  return <Container>
    {dominions.map((dominion) => {
      return <div key={dominion.dominionId}>{dominion.dominionId}</div>;
    })}
  </Container>;
}
