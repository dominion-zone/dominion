import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import { configQO } from "../configQO";
import {
  Dominion,
  DominionSDK,
  Governance,
  Member,
} from "@dominion.zone/dominion-sdk";
import { registryQO } from "../registryQO";

function userDominionsQO({
  network,
  wallet,
  queryClient,
}: {
  network: Network;
  wallet: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "user", wallet, "dominions"],
    queryFn: async ({ queryKey: [network, , wallet] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      const members = await Member.all({ sdk, owner: wallet });
      const governances = await Governance.multiFetch({
        sdk,
        ids: members.map(({ governanceId }) => governanceId),
      });

      const dominions = await Dominion.multiFetch({
        sdk,
        ids: governances.map(({ dominionId }) => dominionId),
      });

      const registry = await queryClient.fetchQuery(
        registryQO({ network: network as Network, queryClient })
      );
      const urlNames = dominions.map(d => registry.findUrlName(d.id) || null);
  
      dominions.forEach((dominion, i) =>
        queryClient.setQueryData<{
          dominion: Dominion;
          governance: Governance;
          urlName: string | null;
        }>([network, "dominion", dominion.id], {
          dominion,
          governance: governances[i],
          urlName: urlNames[i],
        })
      );

      return dominions.map((dominion, i) => ({
        dominion,
        governance: governances[i],
        urlName: urlNames[i],
      }));
    },
  });
}

export default userDominionsQO;
