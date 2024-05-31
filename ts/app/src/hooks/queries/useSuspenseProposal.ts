import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Network } from "../../config/network";
import proposalQO from "../../queryOptions/proposalQO";

function useSuspenseProposal({
  network,
  proposalId,
}: {
  network: Network;
  proposalId: string;
}) {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    proposalQO({ network, queryClient, proposalId })
  );
  return data;
}

export default useSuspenseProposal;
