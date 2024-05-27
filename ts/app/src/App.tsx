import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { SnackbarProvider, useSnackbar } from "notistack";
import { ReactNode, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function QueryNotificator({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    queryClient.setDefaultOptions({
      mutations: {
        onError: (error) => {
          enqueueSnackbar(error.message, {
            variant: "error",
          });
        },
      },
    });
  }, [enqueueSnackbar, queryClient]);

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <QueryNotificator>
          <RouterProvider
            router={router}
            defaultPreload="intent"
            context={{ queryClient }}
          />
        </QueryNotificator>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;
