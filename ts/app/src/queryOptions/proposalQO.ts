import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { configQO } from "./configQO";
import { DominionSDK, Proposal } from "@dominion.zone/dominion-sdk";

function proposalQO({
  network,
  proposalId,
  queryClient,
}: {
  network: Network;
  proposalId: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "proposal", proposalId],
    queryFn: async ({ queryKey: [network, , proposalId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);
      return await Proposal.fetch({ sdk, id: proposalId });
    },
  });
}

export default proposalQO;
