import {Command} from 'commander';
import {installDeployCLI} from './deploy';
import {readFile} from 'mz/fs';
import expandTilde from 'expand-tilde';
import {setContext} from './context';
import {DominionSDK} from '@dominion.zone/dominion-sdk';
import {getFullnodeUrl, SuiClient} from '@mysten/sui.js/client';
import * as YAML from 'yaml';
import {fromB64} from '@mysten/sui.js/utils';
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import { installCreateSelfControlledDominion } from './createSelfControlledDominion';

export const cli = () => {
  const program = new Command();

  program
    .version('0.0.1')
    .allowExcessArguments(false)
    .hook('preAction', async (command: Command) => {
      const cliConfig = JSON.parse(
        await readFile(expandTilde('./config.json'), 'utf8')
      );
      const suiConfig = YAML.parse(
        await readFile(expandTilde('~/.sui/sui_config/client.yaml'), 'utf8')
      );
      const env: string = suiConfig.active_env;
      const walletAddress = suiConfig.active_address;
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
        wallet: wallet!,
        dominionSDK: DominionSDK.create({
          sui: new SuiClient({url: suiEnvConfig.rpc}),
          contractAddress: cliConfig.dominion,
          adminControlAddress: cliConfig.adminControl,
        }),
      });
    });
  
  installDeployCLI(program);
  installCreateSelfControlledDominion(program);

  return program;
};
