/* eslint-disable node/no-unsupported-features/es-builtins */
import {
  TransactionBlock,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

type GovernanceData = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: 'moveObject';
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      admin_cap_id: string;
      cool_off_time: string;
      dominion_owner_cap: {
        type: string;
        fields: {
          dominion_id: string;
          id: {
            id: string;
          };
        };
      };
      extra_weight_lock_time: string;
      hold_up_time: string;
      id: {
        id: string;
      };
      link: string;
      max_voting_time: string;
      min_weight_to_create_proposal: string;
      name: string;
      veto_cap_id: string;
      vote_threshold: string;
    };
  };
};

export class Governance {
  public constructor(
    public readonly id: string,
    public dominionId: string,
    public name: string,
    public link: string,
    public minWeightToCreateProposal: bigint,
    public voteThreshold: bigint,
    public maxVotingTime: bigint
  ) {}

  public static withNew({
    sdk,
    dominionOwnerCap,
    coinType,
    name,
    link,
    minWeightToCreateProposal,
    voteThreshold,
    maxVotingTime,
    txb,
  }: {
    sdk: DominionSDK;
    dominionOwnerCap: TransactionObjectInput;
    coinType: string;
    name: string;
    link: string;
    minWeightToCreateProposal: bigint;
    voteThreshold: bigint;
    maxVotingTime: bigint;
    txb: TransactionBlock;
  }): TransactionResult {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::governance::new`,
      typeArguments: [coinType],
      arguments: [
        txb.object(dominionOwnerCap),
        txb.pure(name),
        txb.moveCall({
          target: '0x2::url::new_unsafe_from_bytes',
          arguments: [txb.pure(link)],
        }),
        txb.pure(minWeightToCreateProposal),
        txb.pure(voteThreshold),
        txb.pure(maxVotingTime),
      ],
    });
  }

  public static withCommit({
    sdk,
    governance,
    coinType,
    txb,
  }: {
    sdk: DominionSDK;
    governance: TransactionObjectInput;
    coinType: string;
    txb: TransactionBlock;
  }): TransactionResult {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::governance::commit`,
      typeArguments: [coinType],
      arguments: [txb.object(governance)],
    });
  }

  public static withNewSelfControlledDominionAndGovernance({
    sdk,
    coinType,
    name,
    link,
    minWeightToCreateProposal,
    voteThreshold,
    maxVotingTime,
    txb,
  }: {
    sdk: DominionSDK;
    coinType: string;
    name: string;
    link: string;
    minWeightToCreateProposal: bigint;
    voteThreshold: bigint;
    maxVotingTime: bigint;
    txb: TransactionBlock;
  }): {
    dominion: TransactionObjectInput;
    governance: TransactionObjectInput;
    vetoCap: TransactionObjectInput;
  } {
    const [dominion, governance, vetoCap] = txb.moveCall({
      target: `${sdk.config.governance.contract}::governance_admin_commander::new_self_controlled_dominion_and_governance`,
      arguments: [
        txb.pure(name),
        txb.pure(link),
        txb.pure(minWeightToCreateProposal),
        txb.pure(voteThreshold),
        txb.pure(maxVotingTime),
        txb.object(sdk.config.dominion.adminControl),
        txb.object(sdk.config.governance.adminControl),
      ],
      typeArguments: [coinType],
    });

    return {dominion, governance, vetoCap};
  }

  public static withCreateSelfControlledDominionAndGovernance({
    sdk,
    name,
    coinType,
    link,
    minWeightToCreateProposal,
    voteThreshold,
    maxVotingTime,
    txb,
  }: {
    sdk: DominionSDK;
    name: string;
    coinType: string;
    link: string;
    minWeightToCreateProposal: bigint;
    voteThreshold: bigint;
    maxVotingTime: bigint;
    txb: TransactionBlock;
  }) {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::governance_admin_commander::create_self_controlled_dominion_and_governance`,
      arguments: [
        txb.pure(name),
        txb.pure(link),
        txb.pure(minWeightToCreateProposal),
        txb.pure(voteThreshold),
        txb.pure(maxVotingTime),
        txb.object(sdk.config.dominion.adminControl),
        txb.object(sdk.config.governance.adminControl),
      ],
      typeArguments: [coinType],
    });
  }

  static async fetch({sdk, id}: {id: string; sdk: DominionSDK}) {
    const {
      objectId,
      content: {
        fields: {
          dominion_owner_cap: {
            fields: {dominion_id},
          },
          name,
          link,
          min_weight_to_create_proposal,
          vote_threshold,
          max_voting_time,
        },
      },
    } = (
      await sdk.sui.getObject({
        id,
        options: {
          showContent: true,
        },
      })
    ).data as GovernanceData;

    return new Governance(
      objectId,
      dominion_id,
      name,
      link,
      BigInt(min_weight_to_create_proposal),
      BigInt(vote_threshold),
      BigInt(max_voting_time)
    );
  }
}
