import { Outlet, createFileRoute } from "@tanstack/react-router";
import AppHeader from "../components/AppHeader";
import { ReactNode, Suspense, useCallback, useEffect } from "react";
import { z } from "zod";
import {
  SuiClientProvider,
  WalletProvider,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { networkConfig, Network } from "../config/network";
import { configQO } from "../queryOptions/configQO";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  validateSearch: z.object({
    network: z.enum(["devnet", "testnet", "mainnet"]).catch("devnet"),
    wallet: z.string().optional(),
  }),
  preSearchFilters: [
    (search) => ({
      ...search,
    }),
  ],
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(configQO()),
});

function WalletHandler({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (currentAccount && currentAccount.address !== search.wallet) {
      navigate({
        search: {
          ...search,
          wallet: currentAccount.address,
        },
      });
    }
  }, [currentAccount, navigate, search]);
  return <>{children}</>;
}

function AppLayout() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const onNetworkChange = useCallback(
    (network: Network) => {
      navigate({
        search: {
          ...search,
          network,
        },
      });
    },
    [navigate, search]
  );

  return (
    <SuiClientProvider
      networks={networkConfig}
      network={search.network}
      onNetworkChange={onNetworkChange}
    >
      <WalletProvider>
        <WalletHandler>
          <Suspense>
            <AppHeader />
            <Outlet />
          </Suspense>
        </WalletHandler>
      </WalletProvider>
    </SuiClientProvider>
  );
}
