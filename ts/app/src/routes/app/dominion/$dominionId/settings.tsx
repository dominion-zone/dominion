import { Container } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import DominionHeader from '../../../../components/DominionHeader'

export const Route = createFileRoute('/app/dominion/$dominionId/settings')({
  component: Settings
})

function Settings() {
  return <Container>
    <DominionHeader tab="settings"/>
  </Container>
}
