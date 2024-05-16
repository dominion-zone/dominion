import {Command} from 'commander';
import {exec} from 'mz/child_process';
import {readFile, writeFile} from 'mz/fs';
import {getContext} from './context';

export const installDeployCLI = (program: Command) => {
  program.command('deploy').action(deployAction);
};

const deployAction = async () => {
  const {couchdb, appConfig, env} = getContext();
  appConfig[env] = {
    ...appConfig[env],
    dominion: {
      contract: '',
    },
    governance: {
      contract: '',
    },
    registry: {
      contract: '',
    },
    frameworkCommander: {
      contract: '',
    },
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
    appConfig[env].dominion.contract = p.packageId;
    console.log('Dominion contract: ', appConfig[env].dominion.contract);
    /*
    newConfig.dominion.adminControl = logs.objectChanges.find(
      ({objectType}: {objectType: string}) =>
        objectType ===
        `${newConfig.dominion.contract}::dominion_admin_commander::DominionAdminControl`
    ).objectId;
    console.log('Dominion admin control: ', newConfig.dominion.adminControl);
    */

    let moveToml = await readFile('../../sui/dominion/Move.toml', 'utf8');
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${appConfig[env].dominion.contract}"`
    );
    moveToml = moveToml.replace(
      /dominion = ".*"/,
      `dominion = "${appConfig[env].dominion.contract}"`
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
    appConfig[env].governance.contract = p.packageId;
    console.log('Governance contract: ', appConfig[env].governance.contract);

    /*
    newConfig.governance.adminControl = logs.objectChanges.find(
      ({objectType}: {objectType: string}) =>
        objectType ===
        `${newConfig.governance.contract}::governance_admin_commander::GovernanceAdminControl`
    ).objectId;
    console.log(
      'Governance admin control: ',
      newConfig.governance.adminControl
    );
    */

    let moveToml = await readFile(
      '../../sui/dominion_governance/Move.toml',
      'utf8'
    );
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${appConfig[env].governance.contract}"`
    );
    await writeFile(
      '../../sui/dominion_governance/Move.toml',
      moveToml,
      'utf8'
    );
  }

  {
    console.log('Deploying registry contract');
    const [out] = await exec(
      'sui client publish --gas-budget 3000000000 --json ../../sui/dominion_registry',
      {
        encoding: 'utf8',
      }
    );

    const logs = JSON.parse(out);
    const p = logs.objectChanges.find(
      ({type}: {type: string}) => type === 'published'
    );
    appConfig[env].registry.contract = p.packageId;
    console.log('Registry contract: ', appConfig[env].registry.contract);

    let moveToml = await readFile(
      '../../sui/dominion_registry/Move.toml',
      'utf8'
    );
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${appConfig[env].registry.contract}"`
    );
    await writeFile('../../sui/dominion_registry/Move.toml', moveToml, 'utf8');
  }

  {
    console.log('Deploying framework commander contract');
    const [out] = await exec(
      'sui client publish --gas-budget 3000000000 --json ../../sui/framework_commander',
      {
        encoding: 'utf8',
      }
    );

    const logs = JSON.parse(out);
    const p = logs.objectChanges.find(
      ({type}: {type: string}) => type === 'published'
    );
    appConfig[env].frameworkCommander.contract = p.packageId;
    console.log(
      'Framework commander contract: ',
      appConfig[env].frameworkCommander.contract
    );

    let moveToml = await readFile(
      '../../sui/framework_commander/Move.toml',
      'utf8'
    );
    moveToml = moveToml.replace(
      /published-at = ".*"/,
      `published-at = "${appConfig[env].frameworkCommander.contract}"`
    );
    await writeFile(
      '../../sui/framework_commander/Move.toml',
      moveToml,
      'utf8'
    );
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
