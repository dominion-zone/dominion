import { useSuspenseQuery } from "@tanstack/react-query";
import { configQO } from "../queryOptions/config";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { Network } from "../config/network";

function useConfig() {
  const { network } = useSuiClientContext();
  return useSuspenseQuery(configQO()).data[network as Network];
}

export default useConfig;
