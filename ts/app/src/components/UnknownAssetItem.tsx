import { Card, Link, ListItem, ListItemButton } from "@mui/material";
import { Network } from "../config/network";

function UnknownAssetItem({ network, id }: { network: Network; id: string }) {
  return (
    <ListItem>
      <Card sx={{ width: "100%" }}>
        <ListItemButton
          component={Link}
          href={`https://suiscan.xyz/${network}/object/${id}`}
        >
          {id}
        </ListItemButton>
      </Card>
    </ListItem>
  );
}

export default UnknownAssetItem;
