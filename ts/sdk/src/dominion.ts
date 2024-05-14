import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

type CommanderData = {
  fields: {
    name: string;
  };
};

type DominionData = {
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
      admin_address: string;
      admin_cap_id: string;
      commanders: {
        fields: {
          contents: CommanderData[];
        };
      };
      owner_address: string;
      owner_cap_id: string;
    };
  };
};

export class Dominion {
  public constructor(
    public readonly sdk: DominionSDK,
    public readonly id: string,
    public adminCapId: string,
    public adminAddress: string,
    public ownerCapId: string,
    public ownerAddress: string,
    public commanders: string[]
  ) {}

  public static withNew({
    sdk,
    txb,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
  }): {
    dominion: TransactionObjectInput;
    adminCap: TransactionObjectInput;
    ownerCap: TransactionObjectInput;
  } {
    const [dominion, adminCap, ownerCap] = txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion::new`,
      arguments: [],
    });

    return {
      dominion,
      adminCap,
      ownerCap,
    };
  }

  public static withCreateSelfControlledDominion(
    sdk: DominionSDK,
    txb: TransactionBlock
  ) {
    txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion_admin_commander::create_self_controlled_dominion`,
    });
  }

  public static withCommit({
    sdk,
    dominion,
    txb,
  }: {
    sdk: DominionSDK;
    dominion: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.dominion.contract}::dominion::commit`,
      arguments: [txb.object(dominion)],
    });
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
      target: `${sdk.config.dominion.contract}::dominion_admin_commander::enable`,
      arguments: [txb.object(dominion), txb.object(adminCap)],
    });
  }

  static fromData({
    sdk,
    data: {
      content: {
        fields: {
          id: {id},
          admin_address,
          admin_cap_id,
          owner_address,
          owner_cap_id,
          commanders: {
            fields: {contents: commanders},
          },
        },
      },
    },
  }: {
    sdk: DominionSDK;
    data: DominionData;
  }): Dominion {
    return new Dominion(
      sdk,
      id,
      admin_cap_id,
      admin_address,
      owner_cap_id,
      owner_address,
      commanders.map(({fields: {name}}) => name)
    );
  }

  public static async fetch({sdk, id}: {sdk: DominionSDK; id: string}) {
    const object = await sdk.sui.getObject({
      id,
      options: {
        showContent: true,
      },
    });

    return Dominion.fromData({sdk, data: object.data as DominionData});
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
      Dominion.fromData({sdk, data: object.data as DominionData})
    );
  }
}
