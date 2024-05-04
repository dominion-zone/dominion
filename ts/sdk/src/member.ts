import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

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
          const {
            objectId,
            content: {
              fields: {
                balance,
                governance_id: governanceId,
                proposal_owner_caps: proposalOwnerCaps,
                votes,
              },
            },
          } = data as MemberData;
          return new Member(
            objectId,
            balance,
            governanceId,
            proposalOwnerCaps,
            votes
          );
        })
      );
      cursor = page.nextCursor;
      if (!page.hasNextPage) {
        break;
      }
    }

    return members;
  }
}
