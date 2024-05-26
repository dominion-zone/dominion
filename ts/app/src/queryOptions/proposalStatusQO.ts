import { SuiClient } from "@mysten/sui.js/client";
import { Network, networkConfig } from "../config/network";
import { configQO } from "./configQO";
import { DominionSDK } from "@dominion.zone/dominion-sdk";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import proposalQO from "./proposalQO";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";

function proposalStatusQO({
  network,
  proposalId,
  queryClient,
}: {
  network: Network;
  proposalId: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "proposal", proposalId, "status"],
    queryFn: async ({ queryKey: [network, , proposalId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);
      const proposal = await queryClient.fetchQuery(
        proposalQO({
          network: network as Network,
          proposalId,
          queryClient,
        })
      );
      const clock = await sdk.sui.getObject({
        id: SUI_CLOCK_OBJECT_ID,
        options: { showContent: true },
      });
      const currentTime = BigInt(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clock.data?.content as any).fields.timestamp_ms
      );

      return proposal.status(currentTime);
    },
    staleTime: 1000 * 60,
  });
}

export default proposalStatusQO;
