import { Stack, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { SyntheticEvent, useCallback } from "react";
import UpButton from "./UpButton";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import proposalQO from "../queryOptions/proposalQO";
import governanceQO from "../queryOptions/governanceQO";
import dominionQO from "../queryOptions/dominionQO";

export type ProposalHeaderTab = "info";

export type ProposalHeaderProps = {
  tab: ProposalHeaderTab;
};

function ProposalHeader({ tab }: ProposalHeaderProps) {
  const navigate = useNavigate();
  const { network, wallet } = useSearch({ from: "/app/proposal/$proposalId" });
  const { proposalId } = useParams({ from: "/app/proposal/$proposalId" });
  const queryClient = useQueryClient();

  const { data: proposal } = useSuspenseQuery(
    proposalQO({ network, queryClient, proposalId })
  );
  const { data: governance } = useSuspenseQuery(
    governanceQO({ network, governanceId: proposal.governanceId, queryClient })
  );
  const {
    data: { dominion, urlName },
  } = useSuspenseQuery(
    dominionQO({ network, dominionId: governance.dominionId, queryClient })
  );

  const handleChange = useCallback(
    (_e: SyntheticEvent, newValue: ProposalHeaderTab) => {
      switch (newValue) {
        case "info":
          navigate({
            to: "/app/proposal/$proposalId",
            params: { proposalId },
            search: { network, wallet },
          });
          break;
      }
    },
    [navigate, network, proposalId, wallet]
  );

  return (
    <Toolbar>
      <UpButton
        to="/app/dominion/$dominionId"
        params={{ dominionId: governance.dominionId }}
      />
      <Stack direction="row" sx={{ ml: 1, mr: 1 }} spacing={2}>
        <Typography>Proposal</Typography>
        <Typography>{proposal.name}</Typography>
        <Link
          to="/app/dominion/$dominionId"
          params={{ dominionId: urlName || dominion.id }}
          search={{ network, wallet }}
        >
          <Typography>{governance.name}</Typography>
        </Link>
      </Stack>
      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Info" value="info" />
      </Tabs>
    </Toolbar>
  );
}

export default ProposalHeader;
