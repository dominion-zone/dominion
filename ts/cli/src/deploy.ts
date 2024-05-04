import {Config} from '@dominion.zone/dominion-sdk';
import {Command} from 'commander';
import {exec} from 'mz/child_process';
import {readFile, writeFile} from 'mz/fs';
import {getContext} from './context';

export const installDeployCLI = (program: Command) => {
  program.command('deploy').action(deployAction);
};

const deployAction = async () => {
  const {couchdb, appConfig, env} = getContext();

  const newConfig = {
    ...((appConfig[env] || {
      dominion: {
        contract: '',
        adminControl: '',
      },
      governance: {
        contract: '',
        adminControl: '',
      },
    }) as Config),
  };

  {
    let moveToml = await readFile('../../sui/dominion/Move.toml', 'utf8');
    moveToml = moveToml.replace(/dominion = ".*"/, 'dominion = "0x0"');
    await writeFile('../../sui/dominion/Move.toml', moveToml, 'utf8');
  }

  {
    console.log('Deploying dominion contract');
    const [out] = await exec(
      'sui client publish --gas-budget 3000000000 --json ../../sui/dominion',
      {
        encoding: 'utf8',
      }
    );
    const logs = JSON.parse(out);
    const p = logs.objectChanges.find(
      ({type}: {type: string}) => type === 'published'
    );
    newConfig.dominion.contract = p.packageId;
    console.log('Dominion contract: ', newConfig.dominion.contract);
    newConfig.dominion.adminControl = logs.objectChanges.find(
      ({objectType}: {objectType: string}) =>
        objectType ===
        `${newConfig.dominion.contract}::dominion_admin_commander::DominionAdminControl`
    ).objectId;
    console.log('Dominion admin control: ', newConfig.dominion.adminControl);

    let moveToml = await readFile('../../sui/dominion/Move.toml', 'utf8');
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${newConfig.dominion.contract}"`
    );
    moveToml = moveToml.replace(
      /dominion = ".*"/,
      `dominion = "${newConfig.dominion.contract}"`
    );
    await writeFile('../../sui/dominion/Move.toml', moveToml, 'utf8');
  }

  {
    console.log('Deploying governance contract');
    const [out] = await exec(
      'sui client publish --gas-budget 3000000000 --json ../../sui/dominion_governance',
      {
        encoding: 'utf8',
      }
    );

    const logs = JSON.parse(out);
    const p = logs.objectChanges.find(
      ({type}: {type: string}) => type === 'published'
    );
    newConfig.governance.contract = p.packageId;
    console.log('Governance contract: ', newConfig.governance.contract);

    newConfig.governance.adminControl = logs.objectChanges.find(
      ({objectType}: {objectType: string}) =>
        objectType ===
        `${newConfig.governance.contract}::governance_admin_commander::GovernanceAdminControl`
    ).objectId;
    console.log(
      'Governance admin control: ',
      newConfig.governance.adminControl
    );

    let moveToml = await readFile(
      '../../sui/dominion_governance/Move.toml',
      'utf8'
    );
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${newConfig.governance.contract}"`
    );
    await writeFile(
      '../../sui/dominion_governance/Move.toml',
      moveToml,
      'utf8'
    );
  }

  await couchdb.post(
    process.env.VITE_CONFIG_PATH as string,
    {
      ...appConfig,
      [env]: newConfig,
    },
    {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            process.env.COUCHDB_USER + ':' + process.env.COUCHDB_PASSWORD
          ).toString('base64'),
      },
    }
  );
};
