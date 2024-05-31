import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Network } from "../../config/network";
import governanceQO from "../../queryOptions/governanceQO";

function useSuspenseGovernance({
  network,
  governanceId,
}: {
  network: Network;
  governanceId: string;
}) {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    governanceQO({ network, queryClient, governanceId })
  );
  return data;
}

export default useSuspenseGovernance;
