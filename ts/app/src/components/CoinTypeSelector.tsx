import { Autocomplete, TextField } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import userCoinTypesQO from "../queryOptions/user/userCoinTypesQO";
import { Network } from "../config/network";
import { useMemo } from "react";
import useSuspenseConfig from "../hooks/useSuspenseConfig";

const suiType = "0x2::sui::SUI";

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
  const { data: coinTypes } = useSuspenseQuery(
    userCoinTypesQO({ network, wallet })
  );

  const config = useSuspenseConfig({ network });

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

  return (
    <Autocomplete
      freeSolo={true}
      options={improvedCoinTypes}
      renderInput={(params) => (
        <TextField name="coinType" {...params} label="Coin type" />
      )}
      value={value}
      onChange={(_, value) => onChange(value)}
    />
  );
}

export default CoinTypeSelector;
