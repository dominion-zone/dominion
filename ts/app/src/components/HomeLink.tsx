import { Button, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";

function HomeLink() {
  return (
    <Button component={Link} to="/" color="inherit">
      <img src="/dominion.svg" alt="Dominion" height="32" />{" "}
      <Typography sx={{ ml: 1 }}>Dominion</Typography>
    </Button>
  );
}

export default HomeLink;
