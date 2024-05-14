import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { Dominion, DominionSDK, Governance } from "@dominion.zone/dominion-sdk";
import { configQO } from "./configQO";
import { registryQO } from "./registryQO";

function dominionQO({
  network,
  dominionId,
  queryClient,
}: {
  network: Network;
  dominionId: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "dominion", dominionId],
    queryFn: async ({ queryKey: [network, , dominionId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      const dominion = await Dominion.fetch({ sdk, id: dominionId });
      const governance = await Governance.fetch({
        sdk,
        id: dominion.ownerAddress,
      });
      const registry = await queryClient.fetchQuery(
        registryQO({ network: network as Network, queryClient })
      );
      return {
        dominion,
        governance,
        urlName: registry.findUrlName(dominionId) || null,
      };
    },
  });
}

export default dominionQO;
