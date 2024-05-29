import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { SuiClient } from "@mysten/sui.js/client";

function allCoinBalancesQO({
  network,
  wallet,
  queryClient,
}: {
  network: Network;
  wallet: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "user", wallet, "allCoinBalances"],
    queryFn: async ({ queryKey: [network, , wallet] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const balances = await sui.getAllBalances({
        owner: wallet,
      });
      for (const coin of balances) {
        queryClient.setQueryData(
          [network, "user", wallet, "coinBalance", coin.coinType],
          coin
        );
      }
      return balances;
    },
  });
}

export default allCoinBalancesQO;
