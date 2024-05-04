import { DominionSDK } from "@dominion.zone/dominion-sdk";
import useConfig from "./useConfig";
import { useSuiClient } from "@mysten/dapp-kit";
import { useMemo } from "react";

function useDominionSdk() {
  const config = useConfig();
  const sui = useSuiClient();
  return useMemo(
    () => new DominionSDK(sui, config),
    [sui, config]
  );
}

export default useDominionSdk;
