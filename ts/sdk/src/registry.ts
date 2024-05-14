/* eslint-disable node/no-unsupported-features/es-builtins */
import {
  TransactionBlock,
  TransactionObjectInput,
} from '@mysten/sui.js/transactions';
import {DominionSDK} from './sdk';

type EntryData = {
  fields: {
    dominion_id: string;
    url_name: string;
  };
};

type RegistryData = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: 'moveObject';
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      owner_cap_id: string;
      policy_address: string;
      entries: EntryData[];
    };
  };
};
/*
type PublicPolicyData = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: 'moveObject';
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      admin_cap_id: string;
    };
  };
};*/

export type Entry = {
  dominionId: string;
  urlName: string;
};

export class Registry {
  public constructor(
    public readonly sdk: DominionSDK,
    public readonly id: string,
    public ownerCapId: string,
    public policyAddress: string,
    public entries: Entry[]
  ) {}

  public findUrlName(dominionId: string): string | undefined {
    return this.entries.find(e => e.dominionId === dominionId)?.urlName;
  }

  public findDominionId(urlName: string): string | undefined {
    if (!urlName) {
      throw new Error('Url name can not be empty');
    }
    return this.entries.find(e => e.urlName === urlName)?.dominionId;
  }

  public static withNew({
    sdk,
    txb,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
  }): TransactionObjectInput {
    return txb.moveCall({
      target: `${sdk.config.registry.contract}::governance_registry::new`,
      arguments: [],
    });
  }

  public static withCreatePublicRegistry({
    sdk,
    txb,
  }: {
    sdk: DominionSDK;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.registry.contract}::public_policy::create_with_registry`,
      arguments: [],
    });
  }

  static async fetch({sdk, id}: {id: string; sdk: DominionSDK}) {
    const {
      objectId,
      content: {
        fields: {owner_cap_id, policy_address, entries},
      },
    } = (
      await sdk.sui.getObject({
        id,
        options: {
          showContent: true,
        },
      })
    ).data as RegistryData;
    return new Registry(
      sdk,
      objectId,
      owner_cap_id,
      policy_address,
      entries.map(({fields: {dominion_id, url_name}}) => ({
        dominionId: dominion_id,
        urlName: url_name,
      }))
    );
  }

  public static withPushBackEntry({
    sdk,
    policy,
    registry,
    dominion,
    urlName = '',
    adminCap,
    txb,
  }: {
    sdk: DominionSDK;
    policy: TransactionObjectInput;
    registry: TransactionObjectInput;
    dominion: TransactionObjectInput;
    urlName?: string;
    adminCap: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    txb.moveCall({
      target: `${sdk.config.registry.contract}::public_policy::push_back_entry`,
      arguments: [
        txb.object(policy),
        txb.object(registry),
        txb.object(dominion),
        txb.pure(urlName),
        txb.object(adminCap),
      ],
    });
  }

  withPushBackEntry({
    dominion,
    urlName = '',
    adminCap,
    txb,
  }: {
    dominion: TransactionObjectInput;
    urlName?: string;
    adminCap: TransactionObjectInput;
    txb: TransactionBlock;
  }) {
    Registry.withPushBackEntry({
      sdk: this.sdk,
      policy: this.policyAddress,
      registry: this.id,
      dominion,
      urlName,
      adminCap,
      txb,
    });
  }
}
