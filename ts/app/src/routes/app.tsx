import { Outlet, createFileRoute } from "@tanstack/react-router";
import AppHeader from "../components/AppHeader";
import { Suspense, useCallback } from "react";
import { z } from "zod";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";

const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

export type Network = keyof typeof networkConfig;

export const Route = createFileRoute("/app")({
  component: App,
  validateSearch: z.object({
    network: z.enum(["devnet", "testnet", "mainnet"]).catch("devnet"),
  }),
  preSearchFilters: [
    (search) => ({
      ...search,
    }),
  ],
});

function App() {
  const { network } = Route.useSearch();
  const navigate = Route.useNavigate();

  const onNetworkChange = useCallback(
    (network: Network) => {
      navigate({
        search: {
          network,
        },
      });
    },
    [navigate]
  );

  return (
    <SuiClientProvider
      networks={networkConfig}
      network={network}
      onNetworkChange={onNetworkChange}
    >
      <WalletProvider>
        <AppHeader />
        <Suspense>
          <Outlet />
        </Suspense>
      </WalletProvider>
    </SuiClientProvider>
  );
}
