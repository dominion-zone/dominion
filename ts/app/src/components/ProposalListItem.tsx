import { Proposal } from "@dominion.zone/dominion-sdk";
import { Card, ListItem, ListItemButton } from "@mui/material";
import { Link } from "@tanstack/react-router";

function ProposalListItem({ proposal }: { proposal: Proposal }) {
  return (
    <ListItem>
      <Card sx={{ width: "100%" }}>
        <ListItemButton component={Link} to={`/app/proposal/${proposal.id}`}>
          {proposal.name}
        </ListItemButton>
      </Card>
    </ListItem>
  );
}

export default ProposalListItem;
