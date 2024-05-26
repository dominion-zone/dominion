import { Container } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import DominionHeader from '../../../../components/DominionHeader'
import useSuspenseConfig from '../../../../hooks/useSuspenseConfig';
import AirdropForm from '../../../../components/AirdropForm';
import MemberInfo from '../../../../components/MemberInfo';
import LockTokensForm from '../../../../components/LockTokensForm';
import userMembersQO from '../../../../queryOptions/user/userMembersQO';

export const Route = createFileRoute('/app/dominion/$dominionId/participate')({
  component: Participate,
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({
    deps: { network, wallet },
    context: { queryClient },
  }) =>
    queryClient.ensureQueryData(
      userMembersQO({ network, queryClient, wallet })
    ),
})

function Participate() {
  const { network, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const config = useSuspenseConfig({ network });
  return <Container>
    <DominionHeader tab="participate"/>
    <MemberInfo network={network} wallet={wallet} dominionId={dominionId}/>
    {config.testCoin && (<AirdropForm network={network} wallet={wallet}/>)}
    <LockTokensForm network={network} wallet={wallet} dominionId={dominionId}/>
  </Container>
}