import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { DominionSDK, Governance } from "@dominion.zone/dominion-sdk";
import { configQO } from "./config";

function governanceQO({
  network,
  governanceId,
  queryClient
}: {
  network: Network;
  governanceId: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "governance", governanceId],
    queryFn: async ({ queryKey: [network, , governanceId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      return await Governance.fetch({ sdk, id: governanceId })
    },
  });
}

export default governanceQO;