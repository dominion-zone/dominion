import {
  Button,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import CoinTypeSelector from "../../components/CoinTypeSelector";
import { z } from "zod";
import allCoinBalancesQO from "../../queryOptions/user/allCoinBalancesQO";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useCallback } from "react";
import useCreateGovernance from "../../hooks/mutations/useCreateGovernance";
import DominionIndexHeader from "../../components/DominionIndexHeader";
import { Formik, Form } from "formik";
import useSuspenseConfig from "../../hooks/useSuspenseConfig";
import { SUI_COIN_TYPE } from "../../consts";
import { formatDigest, normalizeStructTag } from "@mysten/sui.js/utils";
import { SnackbarKey, useSnackbar } from "notistack";

export const Route = createFileRoute("/app/create")({
  component: CreateGovernance,
  validateSearch: z.object({
    wallet: z.string(),
  }),
  loaderDeps: ({ search: { network, wallet } }) => ({ network, wallet }),
  loader: ({ deps: { network, wallet }, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      allCoinBalancesQO({ network, wallet, queryClient })
    ),
});

function CreateGovernance() {
  const { network, wallet } = Route.useSearch();
  const currentAccount = useCurrentAccount();

  const config = useSuspenseConfig({ network });

  const defaultCoin =
    (config.testCoin &&
      normalizeStructTag(
        `${config.testCoin.contract}::test_coin::TEST_COIN`
      )) ||
    SUI_COIN_TYPE;

  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let notification: SnackbarKey;

  const createGovernance = useCreateGovernance({
    network,
    wallet,
    onSuccess({ tx }, { name }) {
      notification = enqueueSnackbar(
        <Typography>
          Dominion {name} creation transaction was sent{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "info",
        }
      );
    },
    onTransactionSuccess({ tx, dominionId }, { name, urlName }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Dominion {name} creation is successfull{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/object/${dominionId}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "success",
        }
      );

      navigate({
        to: "/app/dominion/$dominionId",
        params: { dominionId: urlName || dominionId },
        search: { network, wallet },
      });
    },
    onTransactionError({ tx }) {
      closeSnackbar(notification);
      enqueueSnackbar(
        <Typography>
          Dominion creation failed{" "}
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://suiscan.xyz/${network}/tx/${tx.digest}`}
          >
            {formatDigest(tx.digest)}
          </Link>
        </Typography>,
        {
          variant: "error",
        }
      );
    },
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
      <Typography variant="h3">Create dominion</Typography>
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
            <Stack spacing={1}>
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
            </Stack>
          </Form>
        )}
      </Formik>
    </Container>
  );
}
