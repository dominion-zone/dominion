import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { CssBaseline } from "@mui/material";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <>
        <CssBaseline />
        <Outlet />
        <TanStackRouterDevtools />
      </>
    ),
  }
);
