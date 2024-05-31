import { Button, Card, Link, Typography } from "@mui/material";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSearch } from "@tanstack/react-router";
import userMembersQO from "../queryOptions/user/userMembersQO";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Proposal } from "@dominion.zone/dominion-sdk";
import useCastVote from "../hooks/mutations/useCastVote";
import { useCallback, useMemo } from "react";
import { SnackbarKey, useSnackbar } from "notistack";
import { formatDigest } from "@mysten/sui.js/utils";

function ProposalVoting({
  proposal,
  disabled = false,
  wallet,
}: {
  proposal: Proposal;
  disabled?: boolean;
  wallet: string;
}) {
  const { network } = useSearch({ from: "/app" });

  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();

  const { data: members } = useSuspenseQuery(
    userMembersQO({ network, wallet, queryClient })
  );
  const member = members.find(
    (member) => member.governanceId === proposal.governanceId
  );
  const currentVote = member?.votes.find(
    (vote) => vote.proposalId === proposal.id
  );

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let notification: SnackbarKey;

  const castVote = useCastVote({
    network,
    proposalId: proposal.id,
    wallet,
    onSuccess({ tx }) {
      notification = enqueueSnackbar(
        <Typography>
          Proposal {proposal.id} vote cast transaction was sent{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "info",
        }
      );
    },
    onTransactionSuccess({ tx }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Proposal {proposal.id} vote cast transaction successful{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "success",
        }
      );
    },
    onTransactionError({ tx }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Vote cast failed{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "error",
        }
      );
    },
  });

  const castFor = useCallback(() => {
    castVote.mutate({
      optionIndex: 0n,
      isAbstain: false,
      reliquish: false,
    });
  }, [castVote]);

  const castAgainst = useCallback(() => {
    castVote.mutate({
      optionIndex: null,
      isAbstain: false,
      reliquish: false,
    });
  }, [castVote]);

  const castAbstain = useCallback(() => {
    castVote.mutate({
      optionIndex: null,
      isAbstain: true,
      reliquish: false,
    });
  }, [castVote]);

  const castRelinquish = useCallback(() => {
    castVote.mutate({
      optionIndex: null,
      isAbstain: false,
      reliquish: true,
    });
  }, [castVote]);

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
        disabled={disabled || !currentAccount || currentVoteKind === "for"}
        onClick={castFor}
      >
        For
      </Button>
      <Button
        disabled={disabled || !currentAccount || currentVoteKind === "against"}
        onClick={castAgainst}
      >
        Against
      </Button>
      <Button
        disabled={disabled || !currentAccount || currentVoteKind === "abstain"}
        onClick={castAbstain}
      >
        Abstain
      </Button>
      <Button
        disabled={disabled || !currentAccount || currentVoteKind === null}
        onClick={castRelinquish}
      >
        Reliquish
      </Button>
    </Card>
  );
}

export default ProposalVoting;
