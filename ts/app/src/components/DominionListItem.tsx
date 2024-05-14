import { Dominion, Governance } from "@dominion.zone/dominion-sdk";
import { Card, ListItem, ListItemButton } from "@mui/material";
import { Link } from "@tanstack/react-router";

function DominionListItem({
  urlName,
  dominion,
  governance,
}: {
  urlName: string | null;
  dominion: Dominion;
  governance: Governance;
}) {
  return (
    <ListItem>
      <Card sx={{ width: "100%" }}>
        <ListItemButton
          component={Link}
          to={`/app/dominion/${urlName || dominion.id}`}
        >
          {governance.name}
        </ListItemButton>
      </Card>
    </ListItem>
  );
}

export default DominionListItem;
