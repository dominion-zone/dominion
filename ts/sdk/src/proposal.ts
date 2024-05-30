/* eslint-disable node/no-unsupported-features/es-builtins */
import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {Command, CommandData} from './command';
import {DominionSDK} from './sdk';
import {SUI_CLOCK_OBJECT_ID, normalizeStructTag} from '@mysten/sui.js/utils';

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
      result: {
        fields: {
          executed_at: string | null;
          finalized_at: string;
          option_index: string | null;
        };
      } | null;
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
    public readonly voteWeight: string,
    public readonly executedCommandCount: number
  ) {}

  static async fromData({
    sdk,
    data: {
      fields: {commands, label, vote_weight, executed_command_count},
    },
  }: {
    sdk: DominionSDK;
    data: ProposalOptionData;
  }) {
    return new ProposalOption(
      await Promise.all(commands.map(c => Command.fromData({sdk, data: c}))),
      label,
      vote_weight,
      parseInt(executed_command_count)
    );
  }

  nextCommand() {
    return this.executedCommandCount < this.commands.length
      ? this.commands[this.executedCommandCount]
      : null;
  }
}

export class Proposal {
  constructor(
    public readonly sdk: DominionSDK,
    public readonly coinType: string,
    public readonly governanceId: string,
    public readonly id: string,
    public readonly name: string,
    public readonly link: string,
    public readonly createdAt: bigint,
    public readonly voteThreshold: bigint,
    public readonly maxVotingTime: bigint,
    public readonly holdUpTime: bigint,
    public readonly coolOffTime: bigint,
    public readonly extraWeightLockTime: bigint,
    public readonly abstainVoteWeight: bigint,
    public readonly denyVoteWeight: bigint,
    public readonly totalOptionsVoteWeight: bigint,
    public readonly isExecuting: boolean,
    public readonly votingAt: bigint | null,
    public readonly options: ProposalOption[],
    public result: {
      executedAt: bigint | null;
      finalizedAt: bigint;
      optionIndex: bigint | null;
    } | null
  ) {}

  static async fromData({
    sdk,
    data: {content},
  }: {
    sdk: DominionSDK;
    data: ProposalData;
  }) {
    return new Proposal(
      sdk,
      normalizeStructTag(
        content.type.match(/.+::proposal::Proposal<(.+)>/)![1]
      ),
      content.fields.governance_id,
      content.fields.id.id,
      content.fields.name,
      content.fields.link,
      BigInt(content.fields.created_at),
      BigInt(content.fields.vote_threshold),
      BigInt(content.fields.max_voting_time),
      BigInt(content.fields.hold_up_time),
      BigInt(content.fields.cool_off_time),
      BigInt(content.fields.extra_weight_lock_time),
      BigInt(content.fields.abstain_vote_weight),
      BigInt(content.fields.deny_vote_weight),
      BigInt(content.fields.total_options_vote_weight),
      content.fields.is_executing,
      content.fields.voting_at === null
        ? null
        : BigInt(content.fields.voting_at),
      await Promise.all(
        content.fields.options.map(o => ProposalOption.fromData({sdk, data: o}))
      ),
      content.fields.result
        ? {
            executedAt:
              content.fields.result.fields.executed_at === null
                ? null
                : BigInt(content.fields.result.fields.executed_at),
            finalizedAt: BigInt(content.fields.result.fields.finalized_at),
            optionIndex:
              content.fields.result.fields.option_index === null
                ? null
                : BigInt(content.fields.result.fields.option_index),
          }
        : null
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

  status(currentTime: bigint) {
    if (!this.votingAt) {
      return 'draft';
    }
    if (this.votingAt > currentTime) {
      return 'preparing';
    }
    if (this.votingAt + this.maxVotingTime > currentTime) {
      return 'voting';
    }
    if (this.votingAt + this.maxVotingTime + this.coolOffTime > currentTime) {
      return 'coolingOff';
    }
    if (!this.result) {
      return 'finalizationRequired';
    }
    if (this.result.optionIndex === null) {
      return 'failed';
    }
    if (this.result.finalizedAt + this.holdUpTime > currentTime) {
      return 'holding';
    }
    if (this.result.executedAt === null) {
      return 'executing';
    }
    return 'executed';
  }

  resultOptionIndex(): bigint | null | undefined {
    return this.result?.optionIndex;
  }

  resultOption() {
    const i = this.resultOptionIndex();
    if (i === undefined) {
      return undefined;
    }
    if (i === null) {
      return null;
    }
    return this.options[Number(i)];
  }

  static withFinalizeProposal({
    sdk,
    proposal,
    coinType,
    txb,
  }: {
    sdk: DominionSDK;
    proposal: TransactionObjectInput;
    coinType: string;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::proposal::finalize`,
      typeArguments: [coinType],
      arguments: [txb.object(proposal), txb.object(SUI_CLOCK_OBJECT_ID)],
    });
  }

  static withExecuteNextCommand({
    sdk,
    txb,
    proposal,
    coinType,
    governance,
    dominion,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    proposal: TransactionObjectInput;
    coinType: string;
    governance: TransactionObjectInput;
    dominion: TransactionObjectInput;
  }): {
    executor: TransactionObjectInput;
    proposalExecutor: TransactionObjectInput;
  } {
    const [executor, proposalExecutor] = txb.moveCall({
      target: `${sdk.config.governance.contract}::proposal::execute_next_command`,
      typeArguments: [coinType],
      arguments: [
        txb.object(proposal),
        txb.object(governance),
        txb.object(dominion),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return {executor, proposalExecutor};
  }

  withExecuteNextCommand({
    txb,
    dominion,
  }: {
    txb: TransactionBlock;
    dominion: TransactionObjectInput;
  }): {
    executor: TransactionObjectInput;
    proposalExecutor: TransactionObjectInput;
  } {
    return Proposal.withExecuteNextCommand({
      sdk: this.sdk,
      txb,
      proposal: txb.object(this.id),
      coinType: this.coinType,
      governance: txb.object(this.governanceId),
      dominion,
    });
  }

  static withCommitCommandExecution({
    sdk,
    txb,
    proposal,
    coinType,
    command,
    proposalExecutor,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
    proposal: TransactionObjectInput;
    coinType: string;
    command: TransactionObjectInput;
    proposalExecutor: TransactionObjectInput;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::proposal::commit_command_execution`,
      typeArguments: [coinType],
      arguments: [
        txb.object(proposal),
        txb.object(command),
        txb.object(proposalExecutor),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
  }

  withCommitCommandExecution({
    txb,
    command,
    proposalExecutor,
  }: {
    txb: TransactionBlock;
    command: TransactionObjectInput;
    proposalExecutor: TransactionObjectInput;
  }) {
    Proposal.withCommitCommandExecution({
      sdk: this.sdk,
      txb,
      proposal: txb.object(this.id),
      coinType: this.coinType,
      command,
      proposalExecutor,
    });
  }
}
