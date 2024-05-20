import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import dominionQO from "../../queryOptions/dominionQO";

function useDominion() {
  const { network } = useSearch({ from: "/app" });
  const { dominionId } = useParams({ from: "/app/dominion/$dominionId" });
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    dominionQO({ network, queryClient, dominionId })
  );
  return data;
}

export default useDominion;
