import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient } from "@mysten/sui.js/client";
import {
  Dominion,
  DominionSDK,
  Governance,
  Registry,
} from "@dominion.zone/dominion-sdk";
import { configQO } from "./configQO";

export function registryQO({
  network,
  registryId,
  queryClient,
}: {
  network: Network;
  registryId?: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "registry", registryId],
    queryFn: async ({ queryKey: [network] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.ensureQueryData(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      return await Registry.fetch({
        sdk,
        id: registryId || config.registry.main,
      });
    },
  });
}

export function registryDominionsQO({
  network,
  registryId,
  queryClient,
}: {
  network: Network;
  registryId?: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "registry", registryId, "dominions"],
    queryFn: async ({ queryKey: [network] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];
      const sdk = new DominionSDK(sui, config);

      const registry: Registry = await queryClient.fetchQuery(
        registryQO({ network: network as Network, registryId, queryClient })
      );
      const dominions = await Dominion.multiFetch({
        sdk,
        ids: registry.entries.map((entry) => entry.dominionId),
      });
      const governances = await Governance.multiFetch({
        sdk,
        ids: dominions.map(({ ownerAddress }) => ownerAddress),
      });
      dominions.forEach((dominion, i) =>
        queryClient.setQueryData<{
          dominion: Dominion;
          governance: Governance;
        }>([network, "dominion", dominion.id], {
          dominion,
          governance: governances[i],
        })
      );

      return registry.entries.map(({ urlName }, i) => ({
        urlName: urlName || null,
        dominion: dominions[i],
        governance: governances[i],
      }));
    },
  });
}
