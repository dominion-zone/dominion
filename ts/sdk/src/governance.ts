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
      proposal_ids: string[];
    };
  };
};

export class Governance {
  public constructor(
    public readonly sdk: DominionSDK,
    public readonly id: string,
    public readonly coinType: string,
    public dominionId: string,
    public name: string,
    public link: string,
    public minWeightToCreateProposal: bigint,
    public voteThreshold: bigint,
    public maxVotingTime: bigint,
    public proposalIds: string[]
  ) {}

  public static withNew({
    sdk,
    coinType,
    dominion,
    dominionOwnerCap,
    name,
    link,
    minWeightToCreateProposal,
    voteThreshold,
    maxVotingTime,
    txb,
  }: {
    sdk: DominionSDK;
    coinType: string;
    dominion: TransactionObjectInput;
    dominionOwnerCap: TransactionObjectInput;
    name: string;
    link: string;
    minWeightToCreateProposal: bigint;
    voteThreshold: bigint;
    maxVotingTime: bigint;
    txb: TransactionBlock;
  }): {
    governance: TransactionObjectInput;
    governanceAdminCap: TransactionObjectInput;
    vetoCap: TransactionObjectInput;
  } {
    const [governance, governanceAdminCap, vetoCap] = txb.moveCall({
      target: `${sdk.config.governance.contract}::governance::new`,
      typeArguments: [coinType],
      arguments: [
        txb.object(dominion),
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

    return {
      governance,
      governanceAdminCap,
      vetoCap,
    };
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
      ],
      typeArguments: [coinType],
    });
  }

  static fromData({
    sdk,
    data: {
      objectId,
      content: {
        type,
        fields: {
          dominion_owner_cap: {
            fields: {dominion_id},
          },
          name,
          link,
          min_weight_to_create_proposal,
          vote_threshold,
          max_voting_time,
          proposal_ids,
        },
      },
    },
  }: {
    sdk: DominionSDK;
    data: GovernanceData;
  }) {
    return new Governance(
      sdk,
      objectId,
      type.match(/.+::governance::Governance<(.+)>/)![1],
      dominion_id,
      name,
      link,
      BigInt(min_weight_to_create_proposal),
      BigInt(vote_threshold),
      BigInt(max_voting_time),
      proposal_ids
    );
  }

  static async fetch({sdk, id}: {id: string; sdk: DominionSDK}) {
    const object = await sdk.sui.getObject({
      id,
      options: {
        showContent: true,
      },
    });

    return Governance.fromData({sdk, data: object.data as GovernanceData});
  }

  public static async multiFetch({
    sdk,
    ids,
  }: {
    sdk: DominionSDK;
    ids: string[];
  }) {
    const objects = await sdk.sui.multiGetObjects({
      ids,
      options: {
        showContent: true,
      },
    });
    return objects.map(object =>
      Governance.fromData({sdk, data: object.data as GovernanceData})
    );
  }

  public static withEnableAdminCommander({
    sdk,
    dominion,
    adminCap,
    txb,
  }: {
    sdk: DominionSDK;
    dominion: TransactionObjectInput;
    adminCap: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::governance_admin_commander::enable`,
      arguments: [txb.object(dominion), txb.object(adminCap)],
    });
  }
}
