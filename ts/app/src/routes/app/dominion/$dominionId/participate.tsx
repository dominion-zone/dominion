import { Container } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import useSuspenseConfig from "../../../../hooks/useSuspenseConfig";
import AirdropForm from "../../../../components/AirdropForm";
import MemberInfo from "../../../../components/MemberInfo";
import LockTokensForm from "../../../../components/LockTokensForm";
import userMembersQO from "../../../../queryOptions/user/userMembersQO";
import coinBalanceQO from "../../../../queryOptions/user/coinBalanceQO";
import { z } from "zod";
import dominionQO from "../../../../queryOptions/dominionQO";
import { registryQO } from "../../../../queryOptions/registryQO";

export const Route = createFileRoute("/app/dominion/$dominionId/participate")({
  component: Participate,
  validateSearch: z.object({
    wallet: z.string(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({
    deps: { network, wallet },
    context: { queryClient },
    params: { dominionId },
  }) =>
    Promise.all([
      queryClient.ensureQueryData(
        userMembersQO({ network, queryClient, wallet })
      ),
      (async () => {
        const registry = await queryClient.ensureQueryData(
          registryQO({ network, queryClient })
        );
        if (!dominionId.startsWith("0x")) {
          const id = registry.findDominionId(dominionId);
          if (!id) {
            throw new Error(`Dominion url name not found: ${dominionId}`);
          }
          dominionId = id;
        }
        const { governance } = await queryClient.ensureQueryData(
          dominionQO({ network, dominionId, queryClient })
        );
        await queryClient.ensureQueryData(
          coinBalanceQO({
            network,
            wallet,
            coinType: governance.coinType,
            queryClient,
          })
        );
      })(),
    ]),
});

function Participate() {
  const { network, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const config = useSuspenseConfig({ network });
  return (
    <Container>
      <DominionHeader tab="participate" />
      <MemberInfo network={network} wallet={wallet} dominionId={dominionId} />
      {config.testCoin && (
        <AirdropForm network={network} wallet={wallet} />
      )}
      <LockTokensForm
        network={network}
        wallet={wallet}
        dominionId={dominionId}
      />
    </Container>
  );
}
