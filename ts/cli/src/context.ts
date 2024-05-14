import {DominionSDK} from '@dominion.zone/dominion-sdk';
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {AxiosInstance} from 'axios';

export type Config = {
  dominion: {
    contract: string;
  };
  governance: {
    contract: string;
  };
  registry: {
    contract: string;
    main?: string;
  };
  testCoin?: {
    contract: string;
    control: string;
  };
};

export type AppConfig = Record<string, Config> & {
  _id: string;
  _rev: string;
};

export type Context = {
  couchdb: AxiosInstance;
  appConfig: AppConfig;
  env: string;
  wallet: Ed25519Keypair;
  dominionSDK: DominionSDK;
};

let context: Context;

export const setContext = (v: Context) => {
  context = v;
};

export const getContext = () => {
  return context;
};
