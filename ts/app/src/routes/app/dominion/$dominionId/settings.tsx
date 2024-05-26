import {
  Card,
  Checkbox,
  Container,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import dominionQO from "../../../../queryOptions/dominionQO";
import useSuspenseConfig from "../../../../hooks/useSuspenseConfig";
import { ChangeEvent, useCallback } from "react";

export const Route = createFileRoute("/app/dominion/$dominionId/settings")({
  component: Settings,
});

function Settings() {
  const { network, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: { dominion },
  } = useSuspenseQuery(dominionQO({ network, dominionId, queryClient }));

  const config = useSuspenseConfig({ network });

  const hasCoinCommander = dominion.hasCommander(
    `${config.frameworkCommander.contract}::coin_commander::CoinCommander`
  );

  const hasDominionAdminCommander = dominion.hasCommander(
    `${config.dominion.contract}::dominion_admin_commander::DominionAdminCommander`
  );

  const hasGovernanceAdminCommander = dominion.hasCommander(
    `${config.governance.contract}::governance_admin_commander::GovernanceAdminCommander`
  );

  const navigate = useNavigate();

  const handleCoinCommanderChange = useCallback(
    (_e: ChangeEvent, value: boolean) => {
      navigate({
        to: "/app/dominion/$dominionId/createProposal",
        search: {
          network,
          wallet,
          actions: [
            {
              type: value ? "enableCommander" : "disableCommander",
              commander: `${config.frameworkCommander.contract}::coin_commander::CoinCommander`,
            },
          ],
        },
        params: {
          dominionId,
        },
      });
    },
    [config.frameworkCommander.contract, dominionId, navigate, network, wallet]
  );

  const handleDominionCommanderChange = useCallback(
    (_e: ChangeEvent, value: boolean) => {
      navigate({
        to: "/app/dominion/$dominionId/createProposal",
        search: {
          network,
          wallet,
          actions: [
            {
              type: value ? "enableCommander" : "disableCommander",
              commander: `${config.dominion.contract}::dominion_admin_commander::DominionAdminCommander`,
            },
          ],
        },
        params: {
          dominionId,
        },
      });
    },
    [config.dominion.contract, dominionId, navigate, network, wallet]
  );

  const handleGovernanceCommanderChange = useCallback(
    (_e: ChangeEvent, value: boolean) => {
      navigate({
        to: "/app/dominion/$dominionId/createProposal",
        search: {
          network,
          wallet,
          actions: [
            {
              type: value ? "enableCommander" : "disableCommander",
              commander: `${config.governance.contract}::governance_admin_commander::GovernanceAdminCommander`,
            },
          ],
        },
        params: {
          dominionId,
        },
      });
    },
    [config.governance.contract, dominionId, navigate, network, wallet]
  );

  return (
    <Container>
      <DominionHeader tab="settings" />
      <Card>
        <Typography>Commanders</Typography>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasCoinCommander}
                onChange={handleCoinCommanderChange}
              />
            }
            label="Coin"
          />
        </div>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasDominionAdminCommander}
                onChange={handleDominionCommanderChange}
              />
            }
            label="Dominion admin"
          />
        </div>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasGovernanceAdminCommander}
                onChange={handleGovernanceCommanderChange}
              />
            }
            label="Dominion editor"
          />
        </div>
      </Card>
    </Container>
  );
}
