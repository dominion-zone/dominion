import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Box, CssBaseline } from "@mui/material";
import Footer from "../components/Footer";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <CssBaseline />
        <Outlet />
        <Footer />
      </Box> /*
        <TanStackRouterDevtools position="bottom-left"/>
        <ReactQueryDevtools buttonPosition="bottom-right"/>
      </>*/
    ),
  }
);
