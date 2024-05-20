import { IconButton, ListItem, Typography } from "@mui/material";
import { Network } from "../config/network";
import SendIcon from "@mui/icons-material/Send";
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

function TokenAssetItem({
  network,
  wallet,
  coinType,
  amount,
  dominionId,
}: {
  network: Network;
  wallet?: string;
  coinType: string;
  amount: bigint;
  dominionId: string;
}) {
  const navigate = useNavigate();
  const handleTransfer = useCallback(() => {
    navigate({
      to: "/app/dominion/$dominionId/createProposal",
      search: {
        network,
        wallet,
        actions: [
          {
            type: "transferCoin",
            coinType,
            recipient: wallet || "",
            amount: "0",
          },
        ],
      },
      params: {
        dominionId,
      },
    });
  }, [coinType, dominionId, navigate, network, wallet]);

  return (
    <ListItem>
      <Typography>{coinType}</Typography>:{" "}
      <Typography>{amount.toString()}</Typography>
      <IconButton onClick={handleTransfer}>
        <SendIcon />
      </IconButton>
    </ListItem>
  );
}

export default TokenAssetItem;
