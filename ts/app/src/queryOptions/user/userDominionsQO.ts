import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { configQO } from "../config";
import { DominionSDK, Member } from "@dominion.zone/dominion-sdk";
import governanceQO from "../governanceQO";

function userDominionsQO({
  network,
  wallet,
  queryClient,
}: {
  network: Network;
  wallet?: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: wallet
      ? [network, "user", wallet, "dominions"]
      : [network, "dominions"],
    queryFn: async ({ queryKey: [network, , wallet] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      if (!wallet) {
        return []; // TODO
      }

      const members = await Member.all({ sdk, owner: wallet });
      return await Promise.all(
        members.map((member) =>
          queryClient.fetchQuery(
            governanceQO({
              network: network as Network,
              governanceId: member.governanceId,
              queryClient,
            })
          )
        )
      );
    },
  });
}

export default userDominionsQO;
