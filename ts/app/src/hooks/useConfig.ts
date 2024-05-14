import { useSuspenseQuery } from "@tanstack/react-query";
import { configQO } from "../queryOptions/configQO";
import { Network } from "../config/network";

function useConfig({ network }: { network: Network }) {
  return useSuspenseQuery(configQO()).data[network as Network];
}

export default useConfig;
