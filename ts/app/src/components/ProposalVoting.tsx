import { Button, Card, Typography } from "@mui/material";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSearch } from "@tanstack/react-router";
import userMembersQO from "../queryOptions/user/userMembersQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Proposal } from "@dominion.zone/dominion-sdk";
import useCastVote from "../hooks/mutations/useCastVote";
import { useCallback, useMemo } from "react";

function ProposalVoting({ proposal }: { proposal: Proposal }) {
  const { network, wallet } = useSearch({ from: "/app" });

  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();

  const { data: members } = useSuspenseQuery(
    userMembersQO({ network, wallet: wallet!, queryClient })
  );
  const member = members.find(
    (member) => member.governanceId === proposal.governanceId
  );
  const currentVote = member?.votes.find(
    (vote) => vote.proposalId === proposal.id
  );

  const castVote = useCastVote({ network, proposalId: proposal.id });

  const castFor = useCallback(() => {
    castVote.mutate({
      wallet: wallet!,
      optionIndex: 0n,
      isAbstain: false,
      reliquish: false,
    });
  }, [castVote, wallet]);

  const castAgainst = useCallback(() => {
    castVote.mutate({
      wallet: wallet!,
      optionIndex: null,
      isAbstain: false,
      reliquish: false,
    });
  }, [castVote, wallet]);

  const castAbstain = useCallback(() => {
    castVote.mutate({
      wallet: wallet!,
      optionIndex: null,
      isAbstain: true,
      reliquish: false,
    });
  }, [castVote, wallet]);

  const castRelinquish = useCallback(() => {
    castVote.mutate({
      wallet: wallet!,
      optionIndex: null,
      isAbstain: false,
      reliquish: true,
    });
  }, [castVote, wallet]);

  const currentVoteKind = useMemo(() => {
    if (!currentVote) {
      return null;
    }
    return currentVote.isAbstain
      ? "abstain"
      : currentVote.optionIndex === null
        ? "against"
        : "for";
  }, [currentVote]);

  return (
    <Card>
      <Typography>Vote</Typography>
      {currentVote && <Typography>Current vote: {currentVoteKind}</Typography>}
      <Button
        disabled={!currentAccount || currentVoteKind === "for"}
        onClick={castFor}
      >
        For
      </Button>
      <Button
        disabled={!currentAccount || currentVoteKind === "against"}
        onClick={castAgainst}
      >
        Against
      </Button>
      <Button
        disabled={!currentAccount || currentVoteKind === "abstain"}
        onClick={castAbstain}
      >
        Abstain
      </Button>
      <Button
        disabled={!currentAccount || currentVoteKind === null}
        onClick={castRelinquish}
      >
        Reliquish
      </Button>
    </Card>
  );
}

export default ProposalVoting;
