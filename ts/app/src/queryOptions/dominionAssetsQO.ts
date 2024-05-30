/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../config/network";
import { SuiClient, SuiObjectData } from "@mysten/sui.js/client";
import dominionQO, { DominionInfo } from "./dominionQO";
import { configQO } from "./configQO";
import governanceQO from "./governanceQO";
import { normalizeStructTag } from "@mysten/sui.js/utils";

export type CoinInfo = {
  coinObjectCount: number;
  totalBalance: bigint;
}

export type AssetsInfo = {
  coins: Map<string, CoinInfo>;
  dominionAdmins: DominionInfo[];
  governanceAdmins: DominionInfo[];
  unknown: SuiObjectData[];
};

function dominionAssetsQO({
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
    queryKey: [network, "dominion", dominionId, "assets"],
    queryFn: async ({ queryKey: [network, , dominionId] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);

      const config = (await queryClient.fetchQuery(configQO()))[
        network as Network
      ];

      const coins: Map<string, CoinInfo> = new Map();
      const dominionAdmins: DominionInfo[] = [];
      const governanceAdmins: DominionInfo[] = [];
      const unknown: SuiObjectData[] = [];

      let cursor = null;
      for (;;) {
        const { data, hasNextPage, nextCursor } = await sui.getOwnedObjects({
          owner: dominionId,
          cursor,
          options: {
            showContent: true,
          },
        });
        for (const asset of data) {
          const objectType: string = (asset.data!.content as any).type;
          const coinMatch = objectType.match(/0x2::coin::Coin<(.+)>/);
          if (coinMatch) {
            const coinType = normalizeStructTag(coinMatch[1]);
            const info = coins.get(coinType) || {
              coinObjectCount: 0,
              totalBalance: 0n,
            };
            info.coinObjectCount++;
            info.totalBalance += BigInt((asset.data!.content as any).fields.balance);
            coins.set(coinType, info);
            continue;
          }
          switch (objectType) {
            case `${config.dominion.contract}::dominion::DominionAdminCap`:
              dominionAdmins.push(
                await queryClient.fetchQuery(
                  dominionQO({
                    network: network as Network,
                    dominionId: (asset.data!.content as any).fields.dominion_id,
                    queryClient,
                  })
                )
              );
              break;
            case `${config.governance.contract}::governance::GovernanceAdminCap`: {
              const governance = await queryClient.fetchQuery(
                governanceQO({
                  network: network as Network,
                  governanceId: (asset.data!.content as any).fields
                    .governance_id,
                  queryClient,
                })
              );
              governanceAdmins.push(
                await queryClient.fetchQuery(
                  dominionQO({
                    network: network as Network,
                    dominionId: governance.dominionId,
                    queryClient,
                  })
                )
              );
              break;
            }
            default:
              unknown.push(asset.data!);
              break;
          }
        }

        if (!hasNextPage) {
          break;
        }

        cursor = nextCursor;
      }

      return {
        coins,
        dominionAdmins,
        governanceAdmins,
        unknown,
      };
    },
  });
}

export default dominionAssetsQO;
