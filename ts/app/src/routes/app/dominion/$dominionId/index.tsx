/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Container, Link, List, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import dominionAssetsQO from "../../../../queryOptions/dominionAssetsQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import dominionQO from "../../../../queryOptions/dominionQO";
import DominionAdminItem from "../../../../components/DominionAdminItem";
import UnknownAssetItem from "../../../../components/UnknownAssetItem";
import DepositTokenToDominionButton from "../../../../components/DepositTokenToDominionButton";
import TokenAssetItem from "../../../../components/TokenAssetItem";
import useSuspenseConfig from "../../../../hooks/useSuspenseConfig";
import { registryQO } from "../../../../queryOptions/registryQO";
import useSuspenseDominion from "../../../../hooks/queries/useSuspenseDominion";

export const Route = createFileRoute("/app/dominion/$dominionId/")({
  component: DominionInfo,
  loaderDeps: ({ search: { network } }) => ({ network }),
  async loader({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) {
    const registry = await queryClient.fetchQuery(
      registryQO({ network, queryClient })
    );
    if (!dominionId.startsWith("0x")) {
      const id = registry.findDominionId(dominionId);
      if (!id) {
        throw new Error(`Dominion url name not found: ${dominionId}`);
      }
      dominionId = id;
    }
    await Promise.all([
      queryClient.ensureQueryData(
        dominionQO({ network, queryClient, dominionId })
      ),
      queryClient.ensureQueryData(
        dominionAssetsQO({ network, dominionId, queryClient })
      ),
    ]);
  },
});

function DominionInfo() {
  const { network, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();
  const { dominion, governance } = useSuspenseDominion({ network, dominionId });

  const {
    data: { coins, dominionAdmins, governanceAdmins, unknown },
  } = useSuspenseQuery(dominionAssetsQO({ network, dominionId: dominion.id, queryClient }));

  const config = useSuspenseConfig({ network });

  const hasCoinCommander = dominion.hasCommander(
    `${config.frameworkCommander.contract}::coin_commander::CoinCommander`
  );

  return (
    <Container>
      <DominionHeader tab="info" />
      <Card>
        <Typography>
          Dominion: <Link href={governance.link}>{governance.name}</Link>
        </Typography>
      </Card>
      <Card>
        <h3>Assets</h3>

        <Card>
          <Typography>Tokens:</Typography>
          <List>
            {Array.from(coins.entries()).map(([coinType, { totalBalance }]) => (
              <TokenAssetItem
                network={network}
                wallet={wallet}
                key={coinType}
                coinType={coinType}
                amount={totalBalance}
                dominionId={dominion.id}
              />
            ))}
          </List>
          {wallet && (
            <DepositTokenToDominionButton
              network={network}
              wallet={wallet}
              dominionId={dominion.id}
              disabled={!hasCoinCommander}
            />
          )}
        </Card>

        {dominionAdmins.length > 0 && (
          <Card>
            <Typography>Dominion admins:</Typography>
            <List>
              {dominionAdmins.map((dominion) => (
                <DominionAdminItem key={dominion.dominion.id} {...dominion} />
              ))}
            </List>
          </Card>
        )}

        {governanceAdmins.length > 0 && (
          <Card>
            <Typography>Dominion editors:</Typography>
            <List>
              {governanceAdmins.map((dominion) => (
                <DominionAdminItem key={dominion.dominion.id} {...dominion} />
              ))}
            </List>
          </Card>
        )}

        {unknown.length > 0 && (
          <Card>
            <Typography>Unknown assets:</Typography>
            <List>
              {unknown.map(({ objectId }) => (
                <UnknownAssetItem
                  key={objectId}
                  network={network}
                  id={objectId}
                />
              ))}
            </List>
          </Card>
        )}
      </Card>
    </Container>
  );
}
