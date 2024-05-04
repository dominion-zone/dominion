import { queryOptions } from "@tanstack/react-query";
import { Network, networkConfig } from "../../config/network";
import { SuiClient } from "@mysten/sui.js/client";

function userCoinTypesQO({
  network,
  wallet,
}: {
  network: Network;
  wallet: string;
}) {
  return queryOptions({
    queryKey: [network, "user", wallet, "coinTypes"],
    queryFn: async ({ queryKey: [network, , wallet] }) => {
      const sui = new SuiClient(networkConfig[network as Network]);
      const coins = await sui.getAllBalances({
        owner: wallet,
      });
      return coins.map(({ coinType }) => coinType);
    },
  });
}

export default userCoinTypesQO;
