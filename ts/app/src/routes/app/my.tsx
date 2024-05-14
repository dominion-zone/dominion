import { Container, List } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionIndexHeader from "../../components/DominionIndexHeader";
import userDominionsQO from "../../queryOptions/user/userDominionsQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import DominionListItem from "../../components/DominionListItem";

export const Route = createFileRoute("/app/my")({
  component: () => <YourDominions />,
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      userDominionsQO({ network, wallet: wallet!, queryClient })
    ),
});

function YourDominions() {
  const { network, wallet } = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: dominions } = useSuspenseQuery(
    userDominionsQO({ network, wallet: wallet!, queryClient })
  );

  return (
    <Container>
      <DominionIndexHeader tab="my" />
      <List>
        {dominions.map(({ dominion, governance, urlName }) => (
          <DominionListItem
            key={dominion.id}
            urlName={urlName}
            dominion={dominion}
            governance={governance}
          />
        ))}
      </List>
    </Container>
  );
}
