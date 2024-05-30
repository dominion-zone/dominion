import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Network } from "../../config/network";
import { registryQO } from "../../queryOptions/registryQO";

function useSuspenseDominionIdByUrlName({
  network,
  urlName,
}: {
  network: Network;
  urlName: string;
}) {
  const queryClient = useQueryClient();
  const {data: registry} = useSuspenseQuery(
    registryQO({ network: network as Network, queryClient })
  );
  return registry.findDominionId(urlName);
}

export default useSuspenseDominionIdByUrlName;