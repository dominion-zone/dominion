import {SuiEvent} from '@mysten/sui.js/client';
import {DominionSDK} from '../sdk';

type EntryInsertedData = {
  entry: {
    dominion_id: string;
    url_name: string;
  };
  index: string;
};

export class EntryInserted {
  public constructor(
    public readonly dominionId: string,
    public readonly urlName: string,
    public readonly index: number
  ) {}

  static getType(sdk: DominionSDK): string {
    return `${sdk.config.registry.contract}::dominion_registry::EntryInserted`;
  }

  static parse({
    entry: {dominion_id, url_name},
    index,
  }: EntryInsertedData): EntryInserted {
    return new EntryInserted(dominion_id, url_name, parseInt(index));
  }

  static find({
    sdk,
    events,
  }: {
    sdk: DominionSDK;
    events: SuiEvent[];
  }): EntryInserted | undefined {
    const e = events.find(({type}) => type === EntryInserted.getType(sdk));
    if (e) {
      return EntryInserted.parse(e.parsedJson as EntryInsertedData);
    } else {
      return undefined;
    }
  }
}
