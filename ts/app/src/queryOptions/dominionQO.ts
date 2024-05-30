import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { Dominion, DominionSDK, Governance } from "@dominion.zone/dominion-sdk";
import { configQO } from "./configQO";
import { registryQO } from "./registryQO";
import governanceQO from "./governanceQO";

export type DominionInfo = {
  dominion: Dominion;
  governance: Governance;
  urlName: string | null;
};

function dominionQO({
  network,
  dominionId,
  queryClient,
}: {
  network: Network;
  dominionId: string;
  queryClient: QueryClient;
}) {
  if (!dominionId.startsWith("0x")) {
    throw new Error("Invalid dominion id");
  }

  return queryOptions({
    queryKey: [network, "dominion", dominionId],
    queryFn: async ({
      queryKey: [network, , dominionId],
    }): Promise<DominionInfo> => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      const dominion = await Dominion.fetch({ sdk, id: dominionId });
      const governance = await queryClient.fetchQuery(
        governanceQO({
          network: network as Network,
          governanceId: dominion.ownerAddress,
          queryClient,
        })
      );
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
