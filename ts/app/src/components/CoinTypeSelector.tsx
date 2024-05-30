import { Autocomplete, TextField } from "@mui/material";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import allCoinBalancesQO from "../queryOptions/user/allCoinBalancesQO";
import { Network } from "../config/network";
import { useMemo } from "react";
import useSuspenseConfig from "../hooks/useSuspenseConfig";
import { normalizeStructTag } from "@mysten/sui.js/utils";
import { SUI_COIN_TYPE } from "../consts";

function CoinTypeSelector({
  network,
  wallet,
  value,
  onChange,
}: {
  network: Network;
  wallet: string;
  value: string;
  onChange: (e: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { data: coinTypes } = useSuspenseQuery(
    allCoinBalancesQO({ network, wallet, queryClient })
  );

  const config = useSuspenseConfig({ network });

  const improvedCoinTypes = useMemo(() => {
    const testCoinType: string | undefined =
      config.testCoin && `${config.testCoin.contract}::test_coin::TEST_COIN`;
    return (testCoinType ? [testCoinType] : []).concat(
      [SUI_COIN_TYPE],
      coinTypes
        .filter(
          ({ coinType }) =>
            coinType !== SUI_COIN_TYPE && coinType !== testCoinType
        )
        .map(({ coinType }) => normalizeStructTag(coinType))
    );
  }, [coinTypes, config.testCoin]);

  return (
    <Autocomplete
      freeSolo={true}
      options={improvedCoinTypes}
      renderInput={(params) => (
        <TextField
          name="coinType"
          {...params}
          label="Coin type"
          sx={{ minWidth: "50em" }}
        />
      )}
      value={value}
      onChange={(_, value) => onChange(value)}
    />
  );
}

export default CoinTypeSelector;
