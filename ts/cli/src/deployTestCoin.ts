import {Command} from 'commander';
import {exec} from 'mz/child_process';
import {readFile, writeFile} from 'mz/fs';
import {getContext} from './context';

export const installDeployTestCoinCLI = (program: Command) => {
  program.command('deploy-test-coin').action(deployTestCoinAction);
};

const deployTestCoinAction = async () => {
  const {couchdb, appConfig, env} = getContext();
  if (!appConfig[env]) {
    throw new Error(`Deploy main contracts to the ${env} first`);
  }

  appConfig[env].testCoin = {
    contract: '',
    control: '',
  };

  {
    console.log('Deploying test coin contract');
    const [out] = await exec(
      'sui client publish --gas-budget 3000000000 --json ../../sui/test_coin',
      {
        encoding: 'utf8',
      }
    );
    const logs = JSON.parse(out);
    const p = logs.objectChanges.find(
      ({type}: {type: string}) => type === 'published'
    );
    appConfig[env].testCoin!.contract = p.packageId;

    appConfig[env].testCoin!.control = logs.objectChanges.find(
      ({objectType}: {objectType: string}) =>
        objectType ===
        `${appConfig[env].testCoin!.contract}::test_coin::Control`
    ).objectId;

    console.log(
      `Test coin contract: ${appConfig[env].testCoin!.contract} control: ${
        appConfig[env].testCoin!.control
      }`
    );

    let moveToml = await readFile('../../sui/test_coin/Move.toml', 'utf8');
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${appConfig[env].testCoin!.contract}"`
    );
    await writeFile('../../sui/test_coin/Move.toml', moveToml, 'utf8');
  }

  await couchdb.put(process.env.VITE_CONFIG_PATH as string, appConfig, {
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          process.env.COUCHDB_USER + ':' + process.env.COUCHDB_PASSWORD
        ).toString('base64'),

      Referer: 'https://dominion.zone',
    },
  });
};
