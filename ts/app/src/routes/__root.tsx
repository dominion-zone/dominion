import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { CssBaseline } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <>
        <CssBaseline />
        <Outlet />
        <TanStackRouterDevtools position="bottom-left"/>
        <ReactQueryDevtools buttonPosition="bottom-right"/>
      </>
    ),
  }
);
