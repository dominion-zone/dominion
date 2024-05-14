import { Container, List } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionIndexHeader from "../../components/DominionIndexHeader";
import { registryDominionsQO } from "../../queryOptions/registryQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import DominionListItem from "../../components/DominionListItem";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
  loaderDeps: ({ search: { network } }) => ({ network }),
  loader: ({ deps: { network }, context: { queryClient } }) =>
    queryClient.ensureQueryData(registryDominionsQO({ network, queryClient })),
});

function AppIndex() {
  const { network } = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: registry } = useSuspenseQuery(
    registryDominionsQO({ network, queryClient })
  );

  return (
    <Container>
      <DominionIndexHeader tab="public" />
      <List>
        {registry.map(({ urlName, dominion, governance }) => (
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
