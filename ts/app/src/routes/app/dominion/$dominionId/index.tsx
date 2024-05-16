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
import useConfig from "../../../../hooks/useConfig";

export const Route = createFileRoute("/app/dominion/$dominionId/")({
  component: Info,
  loaderDeps: ({ search: { network } }) => ({ network }),
  loader: ({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) =>
    Promise.all([
      queryClient.ensureQueryData(
        dominionAssetsQO({ network, dominionId, queryClient })
      ),
      queryClient.ensureQueryData(
        dominionQO({ network, dominionId, queryClient })
      ),
    ]),
});

function Info() {
  const { network, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: { dominion, governance },
  } = useSuspenseQuery(dominionQO({ network, dominionId, queryClient }));

  const {
    data: { coins, dominionAdmins, governanceAdmins, unknown },
  } = useSuspenseQuery(dominionAssetsQO({ network, dominionId, queryClient }));

  const config = useConfig({ network });

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
          <DepositTokenToDominionButton
            network={network}
            wallet={wallet}
            dominionId={dominion.id}
            disabled={!hasCoinCommander}
          />
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
