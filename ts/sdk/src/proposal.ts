import {Command, CommandData} from './command';
import {DominionSDK} from './sdk';

type ProposalOptionData = {
  type: string;
  fields: {
    commands: CommandData[];
    details: {type: '0x2::bag::Bag'};
    executed_command_count: string;
    label: string;
    vote_weight: string;
  };
};

type ProposalData = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: 'moveObject';
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      abstain_vote_weight: string;
      cool_off_time: string;
      created_at: string;
      deny_vote_weight: string;
      details: {type: '0x2::bag::Bag'};
      extra_weight_lock_time: string;
      governance_id: string;
      hold_up_time: string;
      id: {id: string};
      is_executing: boolean;
      link: string;
      max_voting_time: string;
      name: string;
      options: ProposalOptionData[];
      owner_cap_id: string;
      result: null;
      total_options_vote_weight: string;
      vote_threshold: string;
      voting_at: string | null;
    };
  };
};

export class ProposalOption {
  constructor(
    public readonly commands: Command[],
    public readonly label: string,
    public readonly voteWeight: string
  ) {}

  static async fromData({
    sdk,
    data: {
      fields: {commands, label, vote_weight},
    },
  }: {
    sdk: DominionSDK;
    data: ProposalOptionData;
  }) {
    return new ProposalOption(
      await Promise.all(commands.map(c => Command.fromData({sdk, data: c}))),
      label,
      vote_weight
    );
  }
}

export class Proposal {
  constructor(
    public readonly sdk: DominionSDK,
    public readonly governanceId: string,
    public readonly id: string,
    public readonly name: string,
    public readonly link: string,
    public readonly voteThreshold: string,
    public readonly maxVotingTime: string,
    public readonly holdUpTime: string,
    public readonly coolOffTime: string,
    public readonly extraWeightLockTime: string,
    public readonly abstainVoteWeight: string,
    public readonly denyVoteWeight: string,
    public readonly totalOptionsVoteWeight: string,
    public readonly isExecuting: boolean,
    public readonly votingAt: string | null,
    public readonly options: ProposalOption[]
  ) {}

  static async fromData({sdk, data}: {sdk: DominionSDK; data: ProposalData}) {
    return new Proposal(
      sdk,
      data.content.fields.governance_id,
      data.content.fields.id.id,
      data.content.fields.name,
      data.content.fields.link,
      data.content.fields.vote_threshold,
      data.content.fields.max_voting_time,
      data.content.fields.hold_up_time,
      data.content.fields.cool_off_time,
      data.content.fields.extra_weight_lock_time,
      data.content.fields.abstain_vote_weight,
      data.content.fields.deny_vote_weight,
      data.content.fields.total_options_vote_weight,
      data.content.fields.is_executing,
      data.content.fields.voting_at,
      await Promise.all(
        data.content.fields.options.map(o =>
          ProposalOption.fromData({sdk, data: o})
        )
      )
    );
  }

  public static async fetch({sdk, id}: {id: string; sdk: DominionSDK}) {
    const object = await sdk.sui.getObject({
      id,
      options: {
        showContent: true,
      },
    });
    return await Proposal.fromData({sdk, data: object.data as ProposalData});
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
    return await Promise.all(
      objects.map(object =>
        Proposal.fromData({sdk, data: object.data as ProposalData})
      )
    );
  }
}
