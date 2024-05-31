import { Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { SyntheticEvent, useCallback } from "react";
import UpButton from "./UpButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import useSuspenseDominion from "../hooks/queries/useSuspenseDominion";

export type DominionHeaderTab =
  | "info"
  | "proposals"
  | "createProposal"
  | "settings"
  | "participate";

export type DominionHeaderProps = {
  tab: DominionHeaderTab;
};

function DominionHeader({ tab }: DominionHeaderProps) {
  const navigate = useNavigate();
  const { network, wallet } = useSearch({ from: "/app/dominion/$dominionId" });
  const { dominionId } = useParams({ from: "/app/dominion/$dominionId" });

  const { governance } = useSuspenseDominion({ network, dominionId })

  const handleChange = useCallback(
    (_e: SyntheticEvent, newValue: DominionHeaderTab) => {
      switch (newValue) {
        case "info":
          navigate({
            to: "/app/dominion/$dominionId",
            params: { dominionId },
            search: { network, wallet },
          });
          break;
        case "proposals":
          navigate({
            to: "/app/dominion/$dominionId/proposals",
            params: { dominionId },
            search: { network, wallet },
          });
          break;
        case "createProposal":
          navigate({
            to: "/app/dominion/$dominionId/createProposal",
            params: { dominionId },
            search: { network, wallet: wallet! },
          });
          break;
        case "settings":
          navigate({
            to: "/app/dominion/$dominionId/settings",
            params: { dominionId },
            search: { network, wallet: wallet! },
          });
          break;
        case "participate":
          navigate({
            to: "/app/dominion/$dominionId/participate",
            params: { dominionId },
            search: { network, wallet: wallet! },
          });
          break;
      }
    },
    [navigate, network, dominionId, wallet]
  );

  return (
    <Toolbar>
      <UpButton to="/app" />
      <Typography sx={{ ml: 1, mr: 2 }}>Dominion: {governance.name}</Typography>
      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Info" value="info" />
        <Tab label="Settings" value="settings" />
        <Tab label="Participate" value="participate" disabled={!wallet} />
        <Tab label="Proposals" value="proposals" />
        <Tab
          icon={<AddCircleOutlineIcon />}
          value="createProposal"
          disabled={!wallet}
        />
      </Tabs>
    </Toolbar>
  );
}

export default DominionHeader;
