import {Command} from 'commander';
import {installDeployCLI} from './deploy';
import {readFile} from 'mz/fs';
import expandTilde from 'expand-tilde';
import {AppConfig, setContext} from './context';
import {DominionSDK} from '@dominion.zone/dominion-sdk';
import {SuiClient} from '@mysten/sui.js/client';
import * as YAML from 'yaml';
import {fromB64} from '@mysten/sui.js/utils';
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {installCreateDominion} from './createDominion';
import {installCreateGovernance} from './createGovernance';
import axios from 'axios';
import * as dotenv from 'dotenv';
import {installDeployTestCoinCLI} from './deployTestCoin';
import {installCreatePublicRegistry} from './createPublicRegistry';
import {installCrank} from './crank';
dotenv.config();

export const cli = () => {
  const program = new Command();

  program
    .version('0.0.1')
    .allowExcessArguments(false)
    .hook('preAction', async () => {
      const couchdb = axios.create({
        baseURL: process.env.VITE_COUCHDB_URL as string,
        timeout: 10000,
      });
      const appConfig = (
        await couchdb.get(process.env.VITE_CONFIG_PATH as string)
      ).data as AppConfig;

      const suiConfig = YAML.parse(
        await readFile(expandTilde('~/.sui/sui_config/client.yaml'), 'utf8')
      );
      const env: string = suiConfig.active_env;
      const walletAddress = suiConfig.active_address;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suiEnvConfig = suiConfig.envs.find((e: any) => e.alias === env);
      const keystore: string[] = JSON.parse(
        await readFile(suiConfig.keystore.File, 'utf8')
      );
      let wallet;
      for (const key of keystore) {
        const raw = fromB64(key);
        if (raw[0] !== 0) {
          throw new Error('Unsupported key type');
        }
        const imported = Ed25519Keypair.fromSecretKey(raw.slice(1));
        if (imported.getPublicKey().toSuiAddress() === walletAddress) {
          wallet = imported;
          break;
        }
      }

      setContext({
        couchdb,
        appConfig,
        env,
        wallet: wallet!,
        dominionSDK: new DominionSDK(
          new SuiClient({url: suiEnvConfig.rpc}),
          appConfig[env]
        ),
      });
    });

  installDeployCLI(program);
  installDeployTestCoinCLI(program);
  installCreateDominion(program);
  installCreateGovernance(program);
  installCreatePublicRegistry(program);
  installCrank(program);

  return program;
};
