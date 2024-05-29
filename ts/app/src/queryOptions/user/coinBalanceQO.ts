import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { CoinBalance, SuiClient } from "@mysten/sui.js/client";

function coinBalanceQO({
  network,
  wallet,
  coinType,
  queryClient,
}: {
  network: Network;
  wallet: string;
  coinType: string;
  queryClient: QueryClient;
}) {
  return queryOptions({
    queryKey: [network, "user", wallet, "coinBalance", coinType],
    queryFn: async ({ queryKey: [network, , wallet, , coinType] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const r = await sui.getBalance({
        owner: wallet,
        coinType,
      });
      queryClient.setQueryData(
        [network, "user", wallet, "allCoinBalances"],
        (balances: CoinBalance[]) => {
          if (balances) {
            for (let i = 0; i < balances.length; i++) {
              if (balances[i].coinType === coinType) {
                balances[i] = r;
              }
            }
          }
          return balances;
        }
      );
      return r;
    },
  });
}

export default coinBalanceQO;
