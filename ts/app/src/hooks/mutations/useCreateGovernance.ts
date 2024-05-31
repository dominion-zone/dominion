import { Network } from "../../config/network";
import {
  Dominion,
  EntryInserted,
  Governance,
  Member,
} from "@dominion.zone/dominion-sdk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import useDominionSdk from "../useDominionSdk";
import useSuspenseConfig from "../useSuspenseConfig";
import { registryQO } from "../../queryOptions/registryQO";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
import {
  TransactionOptions,
  UseSignAndExecuteTransactionOptions,
  signAndExecuteTransactionBlock,
} from "./utils";

export type CreateGovernanceParams = TransactionOptions & {
  name: string;
  coinType: string;
  urlName: string;
  link: string;
  minWeightToCreateProposal: bigint;
  voteThreshold: bigint;
  maxVotingTime: bigint;
};

export type CreateGovernanceResult = {
  tx: SuiSignAndExecuteTransactionBlockOutput;
  dominionId: string;
};

export type UseCreateGovernanceOptions = UseSignAndExecuteTransactionOptions<
  CreateGovernanceResult,
  Error,
  CreateGovernanceParams
> & {
  network: Network;
  wallet: string;
};

function useCreateGovernance({
  network,
  wallet,
  onTransactionSuccess,
  onTransactionError,
  ...mutationOptions
}: UseCreateGovernanceOptions) {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const dominionSdk = useDominionSdk({ network });
  const queryClient = useQueryClient();
  const { data: registry } = useSuspenseQuery(
    registryQO({ network, queryClient })
  );
  const config = useSuspenseConfig({ network });

  return useMutation({
    mutationKey: [network, "createGovernance", wallet],
    async mutationFn({
      name,
      coinType,
      urlName,
      link,
      minWeightToCreateProposal,
      voteThreshold,
      maxVotingTime,
      ...options
    }) {
      const transactionBlock = new TransactionBlock();

      const {
        dominion,
        adminCap: dominionAdminCap,
        ownerCap,
      } = Dominion.withNew({
        sdk: dominionSdk,
        txb: transactionBlock,
      });

      Dominion.withEnableAdminCommander({
        sdk: dominionSdk,
        dominion,
        adminCap: dominionAdminCap,
        txb: transactionBlock,
      });
      Governance.withEnableAdminCommander({
        sdk: dominionSdk,
        dominion,
        adminCap: dominionAdminCap,
        txb: transactionBlock,
      });
      dominionSdk.coinCommander.withEnable({
        sdk: dominionSdk,
        txb: transactionBlock,
        dominion,
        adminCap: dominionAdminCap,
      });
      registry.withPushBackEntry({
        dominion,
        urlName,
        adminCap: dominionAdminCap,
        txb: transactionBlock,
      });

      const { governance, governanceAdminCap, vetoCap } = Governance.withNew({
        sdk: dominionSdk,
        dominion,
        dominionOwnerCap: ownerCap,
        name,
        coinType,
        link,
        minWeightToCreateProposal: BigInt(minWeightToCreateProposal),
        voteThreshold: BigInt(voteThreshold),
        maxVotingTime: BigInt(maxVotingTime),
        txb: transactionBlock,
      });

      transactionBlock.transferObjects(
        [
          transactionBlock.object(dominionAdminCap),
          transactionBlock.object(governanceAdminCap),
        ],
        transactionBlock.moveCall({
          target: "0x2::object::id_address",
          typeArguments: [
            `${dominionSdk.config.dominion.contract}::dominion::Dominion`,
          ],
          arguments: [transactionBlock.object(dominion)],
        })
      );

      const member = Member.withNew({
        sdk: dominionSdk,
        governance,
        coinType,
        txb: transactionBlock,
      });

      if (coinType === `${config.testCoin?.contract}::test_coin::TEST_COIN`) {
        const coin = transactionBlock.moveCall({
          target: `${config.testCoin!.contract}::test_coin::mint_coin`,
          arguments: [
            transactionBlock.pure(1000000000000),
            transactionBlock.object(config.testCoin!.control),
          ],
        });

        Member.withDeposit({
          sdk: dominionSdk,
          member,
          coinType,
          coin,
          txb: transactionBlock,
        });
      }
      Dominion.withCommit({
        sdk: dominionSdk,
        dominion,
        txb: transactionBlock,
      });
      Governance.withCommit({
        sdk: dominionSdk,
        governance,
        coinType,
        txb: transactionBlock,
      });
      transactionBlock.transferObjects(
        [transactionBlock.object(vetoCap), transactionBlock.object(member)],
        wallet
      );
      transactionBlock.setGasBudget(2000000000);
      transactionBlock.setSenderIfNotSet(wallet);

      if (!options.options) {
        options.options = {};
      }
      if (!options.options.showEvents) {
        options.options.showEvents = true;
      }
      const tx = await signAndExecuteTransactionBlock({
        client: dominionSdk.sui,
        currentWallet,
        currentAccount,
        transactionBlock,
        ...options,
        onTransactionSuccess(tx) {
          const { dominionId } = EntryInserted.find({
            sdk: dominionSdk,
            events: tx.events!,
          })!;

          queryClient.invalidateQueries({
            queryKey: [network, "registry", undefined],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "members"],
          });
          queryClient.invalidateQueries({
            queryKey: [network, "user", wallet, "dominions"],
          });
          if (onTransactionSuccess) {
            onTransactionSuccess(
              { tx, dominionId },
              {
                name,
                coinType,
                urlName,
                link,
                minWeightToCreateProposal,
                voteThreshold,
                maxVotingTime,
              },
              undefined
            );
          }
        },
        onTransactionError(tx, error) {
          const { dominionId } = EntryInserted.find({
            sdk: dominionSdk,
            events: tx.events!,
          })!;
          if (onTransactionError) {
            onTransactionError(
              { tx, dominionId },
              error,
              {
                name,
                coinType,
                urlName,
                link,
                minWeightToCreateProposal,
                voteThreshold,
                maxVotingTime,
              },
              undefined
            );
          }
        },
      });

      const { dominionId } = EntryInserted.find({
        sdk: dominionSdk,
        events: tx.events!,
      })!;

      return {
        tx,
        dominionId,
      };
    },
    ...mutationOptions,
  });
}

export default useCreateGovernance;
