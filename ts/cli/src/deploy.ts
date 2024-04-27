import {Command} from 'commander';
import {spawn} from 'mz/child_process';

export const installDeployCLI = (program: Command) => {
  program.command('deploy').action(deployAction);
};

const deployAction = () => {
  let p = spawn('sui', ['client', 'publish', '--gas-budget', '3000000000', '--json', '../../sui/dominion']);
  return new Promise<void>(resolveFunc => {
    p.stdout.on('data', x => {
      process.stdout.write(x.toString());
    });
    p.stderr.on('data', x => {
      process.stderr.write(x.toString());
    });
    p.on('exit', code => {
      resolveFunc();
    });
  });
};
