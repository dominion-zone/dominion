import { Outlet, createFileRoute } from "@tanstack/react-router";
import AppHeader from "../components/AppHeader";
import { ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  SuiClientProvider,
  WalletProvider,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { networkConfig, Network } from "../config/network";
import { configQO } from "../queryOptions/configQO";
import { useSnackbar } from "notistack";

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
  const [currentAddress, setCurrentAddress] = useState(currentAccount?.address);
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (currentAccount?.address && currentAccount.address !== currentAddress) {
      enqueueSnackbar("Connected to wallet " + currentAccount.address, {
        variant: "success",
      });
    } else if (!currentAccount?.address && currentAddress){
      enqueueSnackbar("Disconnected from wallet", {
        variant: "info",
      });
    }
    setCurrentAddress(currentAccount?.address);
  }, [currentAccount?.address, currentAddress, enqueueSnackbar]);

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
