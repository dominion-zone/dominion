import { Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SyntheticEvent, useCallback } from "react";
import UpButton from "./UpButton";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export type DominionIndexHeaderTab = "public" | "my" | "create";

export type DominionIndexHeaderProps = {
  tab: DominionIndexHeaderTab;
};

function DominionIndexHeader({ tab }: DominionIndexHeaderProps) {
  const navigate = useNavigate();
  const { network, wallet } = useSearch({ from: "/app" });

  const handleChange = useCallback(
    (_e: SyntheticEvent, newValue: DominionIndexHeaderTab) => {
      switch (newValue) {
        case "public":
          navigate({ to: "/app", search: { network, wallet } });
          break;
        case "my":
          navigate({ to: "/app/my", search: { network, wallet: wallet! } });
          break;
        case "create":
          navigate({ to: "/app/create", search: { network, wallet: wallet! } });
          break;
      }
    },
    [navigate, network, wallet]
  );

  return (
    <Toolbar>
      <UpButton to="/" />
      <Typography sx={{ ml: 1, mr: 2 }}>Dominions</Typography>
      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Public" value="public" />
        <Tab label="My" value="my" disabled={!wallet} />
        <Tab icon={<AddCircleOutlineIcon/>} value="create" disabled={!wallet} />
      </Tabs>
    </Toolbar>
  );
}

export default DominionIndexHeader;
