import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import dominionQO from "../../queryOptions/dominionQO";
import { Network } from "../../config/network";

function useSuspenseDominion({
  network,
  dominionId,
}: {
  network: Network;
  dominionId: string;
}) {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    dominionQO({ network, queryClient, dominionId })
  );
  return data;
}

export default useSuspenseDominion;
