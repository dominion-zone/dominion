import { Button, Container, TextField } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import CoinTypeSelector from "../../components/CoinTypeSelector";
import { z } from "zod";
import userCoinTypesQO from "../../queryOptions/user/userCoinTypesQO";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useCallback } from "react";
import useCreateGovernance from "../../hooks/mutations/useCreateGovernance";
import DominionIndexHeader from "../../components/DominionIndexHeader";
import { Formik, Form } from "formik";
import useConfig from "../../hooks/useConfig";

export const Route = createFileRoute("/app/create")({
  component: CreateGovernance,
  validateSearch: z.object({
    wallet: z.string(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    queryClient.ensureQueryData(userCoinTypesQO({ network, wallet })),
});

function CreateGovernance() {
  const { network, wallet } = Route.useSearch();
  const currentAccount = useCurrentAccount();

  const config = useConfig({ network });

  const defaultCoin =
    (config.testCoin && `${config.testCoin.contract}::test_coin::TEST_COIN`) ||
    "0x2::sui::SUI";

  const createGovernance = useCreateGovernance({
    network,
    wallet,
  });

  const handleSubmit = useCallback(
    (params: {
      name: string;
      coinType: string;
      urlName: string;
      link: string;
      minWeightToCreateProposal: string;
      voteThreshold: string;
      maxVotingTime: string;
    }) => {
      createGovernance.mutate({
        ...params,
        minWeightToCreateProposal: BigInt(params.minWeightToCreateProposal),
        voteThreshold: BigInt(params.voteThreshold),
        maxVotingTime: 60000n * BigInt(params.maxVotingTime),
      });
    },
    [createGovernance]
  );

  return (
    <Container>
      <DominionIndexHeader tab="create" />
      <h3>Create governance</h3>
      <Formik
        initialValues={{
          name: "",
          coinType: defaultCoin,
          urlName: "",
          link: "",
          minWeightToCreateProposal: "0",
          voteThreshold: "0",
          maxVotingTime: "10",
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
              <CoinTypeSelector
                network={network}
                wallet={wallet}
                value={values.coinType}
                onChange={(value) => setFieldValue("coinType", value || "")}
              />
            </div>
            <div>
              <TextField
                name="urlName"
                label="Url name"
                value={values.urlName}
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
              <TextField
                type="number"
                name="minWeightToCreateProposal"
                label="Min weight to create proposal"
                value={values.minWeightToCreateProposal}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <TextField
                type="number"
                name="voteThreshold"
                label="Vote threshold"
                value={values.voteThreshold}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <TextField
                type="number"
                name="maxVotingTime"
                label="Max voting time minutes"
                value={values.maxVotingTime}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <Button
                type="submit"
                disabled={!currentAccount || createGovernance.isPending}
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
