import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { IconButton } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UpButton({to, params}: {to: string; params?: any}) {
  const navigate = useNavigate();
  const goUp = useCallback(() => {
    navigate({ to, params });
  }, [navigate, params, to]);
  return (
    <IconButton onClick={goUp}>
      <ArrowUpwardIcon />
    </IconButton>
  );
}

export default UpButton;
