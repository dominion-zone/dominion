import { DominionSDK } from "@dominion.zone/dominion-sdk";
import useConfig from "./useConfig";
import { useSuiClient } from "@mysten/dapp-kit";
import { useMemo } from "react";
import { Network } from "../config/network";

function useDominionSdk({ network }: { network: Network }) {
  const config = useConfig({ network });
  const sui = useSuiClient();
  return useMemo(() => new DominionSDK(sui, config), [sui, config]);
}

export default useDominionSdk;
