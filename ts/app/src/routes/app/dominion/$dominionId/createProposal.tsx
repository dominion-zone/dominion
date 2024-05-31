import { Button, Container, TextField } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import DominionHeader from "../../../../components/DominionHeader";
import { z } from "zod";
import { Formik, Form } from "formik";
import { useCallback } from "react";
import ProposalActionsEditor from "../../../../components/ProposalActionsEditor";
import useCreateProposal from "../../../../hooks/mutations/useCreateProposal";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Action } from "../../../../types/actions";
import userMembersQO from "../../../../queryOptions/user/userMembersQO";
import allCoinBalancesQO from "../../../../queryOptions/user/allCoinBalancesQO";

const action = z.union([
  z.object({
    type: z.literal("enableCommander"),
    commander: z.string(),
  }),
  z.object({
    type: z.literal("disableCommander"),
    commander: z.string(),
  }),
  z.object({
    type: z.literal("transferCoin"),
    coinType: z.string(),
    recipient: z.string(),
    amount: z.string(),
  }),
]);

export const Route = createFileRoute(
  "/app/dominion/$dominionId/createProposal"
)({
  component: CreateProposal,
  validateSearch: z.object({
    actions: z.array(action).optional(),
    wallet: z.string(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        userMembersQO({ network, queryClient, wallet })
      ),
      queryClient.ensureQueryData(
        allCoinBalancesQO({ network, wallet, queryClient })
      ),
    ]),
});

function CreateProposal() {
  const { network, actions, wallet } = Route.useSearch();
  const { dominionId } = Route.useParams();
  const currentAccount = useCurrentAccount();

  const mutation = useCreateProposal({ network, dominionId, wallet });

  const handleSubmit = useCallback(
    ({
      name,
      link,
      actions,
    }: {
      name: string;
      link: string;
      actions: Action[];
    }) => {
      mutation.mutate(
        { name, link, actions },
        {
          onSuccess: () => {},
        }
      );
    },
    [mutation]
  );
  return (
    <Container>
      <DominionHeader tab="createProposal" />
      <Formik
        initialValues={{
          name: actions && actions[0] ? `Execute ${actions[0].type}` : "",
          link: "",
          actions: actions || [],
        }}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <div>
              <TextField
                name="name"
                label="Name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <TextField
                name="link"
                label="Link"
                value={values.link}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <ProposalActionsEditor
                network={network}
                actions={values.actions}
                setActions={(actions) => setFieldValue("actions", actions)}
              />
            </div>
            <div>
              <Button
                type="submit"
                disabled={!wallet || !currentAccount || mutation.isPending}
              >
                Create
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Container>
  );
}
