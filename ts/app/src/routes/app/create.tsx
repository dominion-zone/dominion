import { Button, Stack, TextField } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import CoinTypeSelector from "../../components/CoinTypeSelector";
import { z } from "zod";
import userCoinTypesQO from "../../queryOptions/user/userCoinTypesQO";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { useCreateGovernance } from "../../hooks/mutations/useCreateGovernance";

export const Route = createFileRoute("/app/create")({
  component: CreateGovernance,
  validateSearch: z.object({
    wallet: z.string(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    queryClient.ensureQueryData(userCoinTypesQO({ network, wallet })),
});

function CreateGovernance() {
  const { network, wallet } = Route.useSearch();
  const currentAccount = useCurrentAccount();

  const [name, setName] = useState("");

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setName(event.target.value),
    [setName]
  );

  const [coinType, setCoinType] = useState<string | null>(null);

  const [link, setLink] = useState("");

  const handleLinkChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setLink(event.target.value),
    [setLink]
  );

  const [minWeightToCreateProposal, setMinWeightToCreateProposal] =
    useState("0");

  const handleMinWeightToCreateProposalChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setMinWeightToCreateProposal(event.target.value),
    [setMinWeightToCreateProposal]
  );

  const [voteThreshold, setVoteThreshold] = useState("0");

  const handleVoteThresholdChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setVoteThreshold(event.target.value),
    [setVoteThreshold]
  );

  const [maxVotingTime, setMaxVotingTime] = useState("0");

  const handleMaxVotingTimeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setMaxVotingTime(event.target.value),
    [setMaxVotingTime]
  );

  const createGovernance = useCreateGovernance({
    network,
    coinType: coinType || "0x2::sui::SUI",
    name,
    link,
    minWeightToCreateProposal: BigInt(minWeightToCreateProposal),
    voteThreshold: BigInt(voteThreshold),
    maxVotingTime: BigInt(maxVotingTime),
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      createGovernance.mutate();
    },
    [createGovernance]
  );

  return (
    <Stack direction="column" component="form" onSubmit={handleSubmit}>
      <h1>Create governance</h1>
      <TextField
        name="name"
        label="Name"
        value={name}
        onChange={handleNameChange}
      />
      <CoinTypeSelector
        network={network}
        wallet={wallet}
        value={coinType}
        onChange={setCoinType}
      />
      <TextField
        name="link"
        label="Link"
        value={link}
        onChange={handleLinkChange}
      />
      <TextField
        type="number"
        name="minWeightToCreateProposal"
        label="Min weight to create proposal"
        value={minWeightToCreateProposal}
        onChange={handleMinWeightToCreateProposalChange}
      />
      <TextField
        type="number"
        name="voteThreshold"
        label="Vote threshold"
        value={voteThreshold}
        onChange={handleVoteThresholdChange}
      />
      <TextField
        type="number"
        name="maxVotingTime"
        label="Max voting time minutes"
        value={maxVotingTime}
        onChange={handleMaxVotingTimeChange}
      />
      <Button
        type="submit"
        disabled={!currentAccount || createGovernance.isPending}
      >
        Create
      </Button>
    </Stack>
  );
}
