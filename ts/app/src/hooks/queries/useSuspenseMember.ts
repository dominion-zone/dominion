import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Network } from "../../config/network";
import userMembersQO from "../../queryOptions/user/userMembersQO";
import useSuspenseDominion from "./useSuspenseDominion";

function useSuspenseMember({
  network,
  dominionId,
  wallet,
}: {
  network: Network;
  dominionId: string;
  wallet?: string;
}) {
  const queryClient = useQueryClient();
  const { data: members } = useSuspenseQuery(
    userMembersQO({ network, wallet, queryClient })
  );
  const { governance } = useSuspenseDominion({ network, dominionId });
  return members.find((m) => m.governanceId === governance.id);
}

export default useSuspenseMember;
