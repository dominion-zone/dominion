import { Tab, Tabs, Toolbar } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SyntheticEvent, useCallback } from "react";

function DominionIndexHeader({ tab }: { tab: "public" | "my" | "create" }) {
  const navigate = useNavigate();
  const { network, wallet } = useSearch({ from: "/app" });

  const handleChange = useCallback(
    (_e: SyntheticEvent, newValue: "public" | "my" | "create") => {
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
      <Tabs value={tab} onChange={handleChange} sx={{width: 'auto'}}>
        <Tab label="Public" value="public" />
        <Tab label="My" value="my" disabled={!wallet} />
        <Tab
          label="Create"
          value="create"
          disabled={!wallet}
          sx={{ ml: "auto" }}
        />
      </Tabs>
    </Toolbar>
  );
}

export default DominionIndexHeader;
