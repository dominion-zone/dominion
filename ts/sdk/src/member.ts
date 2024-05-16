import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';
import {SUI_CLOCK_OBJECT_ID} from '@mysten/sui.js/utils';

type MemberData = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: 'moveObject';
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: {
        id: string;
      };
      balance: string;
      governance_id: string;
      proposal_owner_caps: [];
      votes: [];
    };
  };
};

export class Member {
  public constructor(
    public readonly id: string,
    public balance: string,
    public governanceId: string,
    public proposalOwnerCaps: [],
    public votes: []
  ) {}

  public static withNew({
    sdk,
    governance,
    coinType,
    txb,
  }: {
    sdk: DominionSDK;
    governance: TransactionObjectInput;
    coinType: string;
    txb: TransactionBlock;
  }): TransactionObjectInput {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::member::new`,
      arguments: [txb.object(governance)],
      typeArguments: [coinType],
    });
  }

  public static withDeposit({
    sdk,
    member,
    coinType,
    coin,
    txb,
  }: {
    sdk: DominionSDK;
    member: TransactionObjectInput;
    coinType: string;
    coin: TransactionObjectInput;
    txb: TransactionBlock;
  }): TransactionObjectInput {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::member::deposit`,
      arguments: [txb.object(member), txb.object(coin)],
      typeArguments: [coinType],
    });
  }

  public static fromData({
    objectId,
    content: {
      fields: {
        balance,
        governance_id: governanceId,
        proposal_owner_caps: proposalOwnerCaps,
        votes,
      },
    },
  }: MemberData): Member {
    return new Member(
      objectId,
      balance,
      governanceId,
      proposalOwnerCaps,
      votes
    );
  }

  public static async all({sdk, owner}: {sdk: DominionSDK; owner: string}) {
    const members = [];

    for (let cursor: string | null | undefined; ; ) {
      const page = await sdk.sui.getOwnedObjects({
        owner,
        filter: {
          StructType: `${sdk.config.governance.contract}::member::Member`,
        },
        options: {
          showContent: true,
        },
        cursor,
      });
      members.push(
        ...page.data.map(({data}) => {
          return Member.fromData(data as MemberData);
        })
      );
      if (!page.hasNextPage) {
        break;
      }
      cursor = page.nextCursor;
    }

    return members;
  }

  public static withNewProposal({
    sdk,
    member,
    governance,
    coinType,
    name,
    link,
    txb,
  }: {
    sdk: DominionSDK;
    member: TransactionObjectInput;
    governance: TransactionObjectInput;
    coinType: string;
    name: string;
    link: string;
    txb: TransactionBlock;
  }) {
    return txb.moveCall({
      target: `${sdk.config.governance.contract}::member::new_proposal`,
      arguments: [
        txb.object(member),
        txb.object(governance),
        txb.pure(name),
        txb.moveCall({
          target: '0x2::url::new_unsafe_from_bytes',
          arguments: [txb.pure(link)],
        }),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [coinType],
    });
  }

  public static withAddOption({
    sdk,
    proposalBuilder,
    coinType,
    label,
    commands,
    txb,
  }: {
    sdk: DominionSDK;
    proposalBuilder: TransactionObjectInput;
    coinType: string;
    label: string;
    commands: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::member::add_option`,
      arguments: [
        txb.object(proposalBuilder),
        txb.pure(label),
        txb.object(commands),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [coinType],
    });
  }

  public static withStart({
    sdk,
    proposalBuilder,
    coinType,
    delay,
    txb,
  }: {
    sdk: DominionSDK;
    proposalBuilder: TransactionObjectInput;
    coinType: string;
    delay: bigint;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::member::start`,
      arguments: [
        txb.object(proposalBuilder),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.pure(delay),
      ],
      typeArguments: [coinType],
    });
  }

  public static withCommit({
    sdk,
    proposalBuilder,
    coinType,
    member,
    txb,
  }: {
    sdk: DominionSDK;
    proposalBuilder: TransactionObjectInput;
    coinType: string;
    member: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.governance.contract}::member::commit`,
      arguments: [txb.object(proposalBuilder), txb.object(member)],
      typeArguments: [coinType],
    });
  }
}
