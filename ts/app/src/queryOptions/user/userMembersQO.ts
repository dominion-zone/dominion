import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { configQO } from "../configQO";
import {
  DominionSDK,
  Member,
} from "@dominion.zone/dominion-sdk";

function userMembersQO({
  network,
  wallet,
  queryClient,
}: {
  network: Network;
  wallet?: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "user", wallet, "members"],
    queryFn: async ({ queryKey: [network, , wallet] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);
      return await Member.all({ sdk, owner: wallet! });
    },
    enabled: !!wallet,
  });
}

export default userMembersQO;
