import {DominionSDK} from "@dominion.zone/dominion-sdk";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';

export type Context = {
    wallet: Ed25519Keypair;
    dominionSDK: DominionSDK;
};

let context: Context;

export const setContext = (v: Context) => {
    context = v;
}

export const getContext = () => {
    return context;
}