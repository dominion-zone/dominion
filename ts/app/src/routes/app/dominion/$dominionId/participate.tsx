import { Container } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import DominionHeader from '../../../../components/DominionHeader'

export const Route = createFileRoute('/app/dominion/$dominionId/participate')({
  component: Participate
})

function Participate() {
  return <Container>
    <DominionHeader tab="participate"/>
  </Container>
}