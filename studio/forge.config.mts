import { execFileSync } from 'node:child_process';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerAppImage } from '@reforged/maker-appimage';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { STAGED_CORE, stageCore } from './scripts/stageCore.ts';

// The Linux menus' entry (deb, rpm and AppImage).
const LINUX_ENTRY = {
  name: 'giz-estudio',
  productName: 'giz Estúdio',
  genericName: 'Video Studio',
  bin: 'giz-estudio',
  icon: 'assets/icon/icon.png',
  categories: ['AudioVideo' as const, 'Video' as const],
};

// The rpm needs rpmbuild (the release workflow installs it; a machine without it makes the other packages only).
const hasRpmbuild = (() => {
  try {
    execFileSync('rpmbuild', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // No spaces or accents in the program's file name (the Linux packages and their menu entries run it by name).
    executableName: 'giz-estudio',
    // No extension: the packager picks icon.ico on Windows and icon.icns on macOS.
    icon: 'assets/icon/icon',
    // Core (sources, data, production modules, the prebuilt Remotion bundle, Chrome Headless Shell) goes to
    // resources/core, outside the asar: see config/coreLocation.ts and scripts/stageCore.ts.
    extraResource: [STAGED_CORE],
  },
  rebuildConfig: {},
  hooks: {
    prePackage: async () => {
      await stageCore();
    },
  },
  makers: [
    new MakerSquirrel({ name: 'giz_estudio', setupIcon: 'assets/icon/icon.ico' }),
    new MakerZIP({}, ['darwin', 'linux', 'win32']),
    new MakerDMG({ icon: 'assets/icon/icon.icns', format: 'ULFO' }),
    new MakerDeb({ options: { ...LINUX_ENTRY, maintainer: 'giz', section: 'video' } }),
    ...(hasRpmbuild ? [new MakerRpm({ options: { ...LINUX_ENTRY, license: 'MIT' } })] : []),
    new MakerAppImage({ options: LINUX_ENTRY }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          // The setup worker (GPU install, model downloads) runs in its own utility process, built next to main.cjs.
          entry: 'src/main/worker/setupWorker.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          // The voice worker (the local voice and Whisper, kept loaded) runs in its own utility process too.
          entry: 'src/main/worker/voiceWorker.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      // Checks the app's asar (its own code). Core lives beside it in resources/core and is not covered: the app is
      // not signed (spec ruling), so whoever can change files there could change the binary as well.
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
