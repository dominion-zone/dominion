import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import dominionQO from "../../queryOptions/dominionQO";
import { Network } from "../../config/network";
import { registryQO } from "../../queryOptions/registryQO";

function useSuspenseDominion({
  network,
  dominionId,
}: {
  network: Network;
  dominionId: string;
}) {
  const queryClient = useQueryClient();

  const {data: registry} = useSuspenseQuery(registryQO({ network, queryClient }));

  if (!dominionId.startsWith("0x")) {
    const id = registry.findDominionId(dominionId);
    if (!id) {
      throw new Error(`Dominion url name not found: ${dominionId}`);
    }
    dominionId = id;
  }

  const { data } = useSuspenseQuery(
    dominionQO({ network, queryClient, dominionId })
  );
  return data;
}

export default useSuspenseDominion;
