import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { IconButton } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

function UpButton({to}: {to: string}) {
  const navigate = useNavigate();
  const goUp = useCallback(() => {
    navigate({ to, });
  }, [navigate, to]);
  return (
    <IconButton onClick={goUp}>
      <ArrowUpwardIcon />
    </IconButton>
  );
}

export default UpButton;
