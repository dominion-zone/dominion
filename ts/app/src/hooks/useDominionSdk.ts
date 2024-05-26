import { DominionSDK } from "@dominion.zone/dominion-sdk";
import useSuspenseConfig from "./useSuspenseConfig";
import { useSuiClient } from "@mysten/dapp-kit";
import { useMemo } from "react";
import { Network } from "../config/network";

function useDominionSdk({ network }: { network: Network }) {
  const config = useSuspenseConfig({ network });
  const sui = useSuiClient();
  return useMemo(() => new DominionSDK(sui, config), [sui, config]);
}

export default useDominionSdk;
