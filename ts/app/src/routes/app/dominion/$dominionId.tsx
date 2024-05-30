import { Outlet, createFileRoute } from "@tanstack/react-router";
import dominionQO from "../../../queryOptions/dominionQO";
import { registryQO } from "../../../queryOptions/registryQO";

export const Route = createFileRoute("/app/dominion/$dominionId")({
  component: Outlet,
  loaderDeps: ({ search: { network } }) => ({ network }),
  async loader({
    deps: { network },
    context: { queryClient },
    params: { dominionId },
  }) {
    const registry = await queryClient.ensureQueryData(registryQO({ network, queryClient }));
    if (!dominionId.startsWith("0x")) {
      const id = registry.findDominionId(dominionId);
      if (!id) {
        throw new Error(`Dominion url name not found: ${dominionId}`);
      }
      dominionId = id;
    }
    await queryClient.ensureQueryData(
      dominionQO({ network, queryClient, dominionId })
    );
  }
});
