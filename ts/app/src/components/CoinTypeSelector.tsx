import { Autocomplete, TextField } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import userCoinTypesQO from "../queryOptions/user/userCoinTypesQO";
import { Network } from "../config/network";
import { useEffect, useMemo } from "react";
import useConfig from "../hooks/useConfig";

const suiType = "0x2::sui::SUI";

function CoinTypeSelector({
  network,
  wallet,
  value,
  onChange,
}: {
  network: Network;
  wallet: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data: coinTypes } = useSuspenseQuery(
    userCoinTypesQO({ network, wallet })
  );

  const config = useConfig();

  const improvedCoinTypes = useMemo(() => {
    const testCoinType: string | undefined =
      config.testCoin && `${config.testCoin.contract}::test_coin::TEST_COIN`;

    return (testCoinType ? [testCoinType] : []).concat(
      [suiType],
      coinTypes.filter(
        (coinType) => coinType !== suiType && coinType !== testCoinType
      )
    );
  }, [coinTypes, config.testCoin]);

  useEffect(() => {
    if (value === null) {
      onChange(improvedCoinTypes[0]);
    }
  });

  return (
    <Autocomplete
      freeSolo={true}
      options={improvedCoinTypes}
      renderInput={(params) => <TextField {...params} label="Coin type" />}
      value={value}
      onChange={(_, value) => onChange(value)}
    />
  );
}

export default CoinTypeSelector;
