import { Container } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import DominionHeader from '../../../../components/DominionHeader'

export const Route = createFileRoute('/app/dominion/$dominionId/proposals')({
  component: Proposals
})

function Proposals() {
  return <Container>
    <DominionHeader tab="proposals"/>
  </Container>
}