import { Container } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'
import DominionHeader from '../../../../components/DominionHeader';

export const Route = createFileRoute('/app/dominion/$dominionId/')({
  component: Info
});

function Info() {
  return <Container>
    <DominionHeader tab="info"/>
  </Container>
}