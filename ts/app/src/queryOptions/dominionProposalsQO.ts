import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { configQO } from "./configQO";
import { DominionSDK, Proposal } from "@dominion.zone/dominion-sdk";
import dominionQO from "./dominionQO";

function dominionProposalsQO({
  network,
  dominionId,
  queryClient,
}: {
  network: Network;
  dominionId: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "dominion", dominionId, "proposals"],
    queryFn: async ({ queryKey: [network, , dominionId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);
      const { governance } = await queryClient.fetchQuery(
        dominionQO({ network: network as Network, dominionId, queryClient })
      );
      const proposals = await Proposal.multiFetch({ sdk, ids: governance.proposalIds });
      for (const proposal of proposals) {
        queryClient.setQueryData([network, "proposal", proposal.id], proposal);
      }
      return proposals;
    },
  });
}

export default dominionProposalsQO;
