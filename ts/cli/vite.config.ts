import {defineConfig, mergeConfig} from 'vite';
import {tanstackBuildConfig} from '@tanstack/config/build';

const config = defineConfig({
  // Framework plugins, vitest config, etc.
});

export default mergeConfig(
  config,
  tanstackBuildConfig({
    entry: './src/index.ts',
    srcDir: './src',
  })
);
