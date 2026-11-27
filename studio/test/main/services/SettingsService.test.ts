import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { InterfaceLanguage } from '../../../src/shared/i18n/translate.ts';
import { SettingsService } from '../../../src/main/services/SettingsService.ts';
import { grantsFor } from '../../doubles/fakes.ts';
import { CORE_DEFAULTS, InMemoryAppConfig, InMemorySharedConfig } from '../../doubles/settingsFakes.ts';

function settingsService(picked: string | null = null, delay = 0) {
  const app = new InMemoryAppConfig(delay);
  const shared = new InMemorySharedConfig();
  const grants = grantsFor();
  const made: string[] = [];
  const languages: InterfaceLanguage[] = [];
  const service = new SettingsService({
    app, shared, grants,
    picker: { pickFolder: async () => picked },
    makeFolder: async (folder) => void made.push(folder),
    defaultProjectsFolder: '/home/ana/giz/projetos',
    systemLanguage: 'en',
    onLanguage: (language) => void languages.push(language),
  });
  return { service, app, shared, grants, made, languages };
}

test('the first run: no app config yet, the system language, core values from giz.config.json', async () => {
  const { service } = settingsService();
  assert.deepEqual(await service.get(), {
    firstRun: true, language: 'en', projectsFolder: null, defaultProjectsFolder: '/home/ana/giz/projetos',
    providers: { text: 'anthropic', image: 'openai', voice: 'qwen' }, toursSeen: [], ...CORE_DEFAULTS,
  });
});

test("update keeps the Studio's own choices in its config and the shared ones in giz.config.json", async () => {
  const { service, app, shared, languages } = settingsService();
  const settings = await service.update({ language: 'pt-BR', providers: { image: 'fal' } });
  assert.equal(settings.language, 'pt-BR');
  assert.deepEqual(settings.providers, { text: 'anthropic', image: 'fal', voice: 'qwen' });
  assert.deepEqual(shared.writes, [], 'a language change does not touch giz.config.json');
  assert.deepEqual(languages, ['pt-BR']);
  await service.update({ model: '1.7b', device: 'cuda', remotionLicense: 'pessoa-fisica' });
  assert.deepEqual(shared.writes, [{ device: 'cuda', model: '1.7b', remotionLicense: 'pessoa-fisica' }]);
  assert.equal(app.config?.language, 'pt-BR');
  assert.equal(JSON.stringify(app.config).includes('1.7b'), false, 'the shared values live only in giz.config.json');
});

test('the suggested projects folder is created, saved and granted to the window', async () => {
  const { service, grants, made } = settingsService();
  const settings = await service.projectsFolder('default');
  assert.equal(settings.projectsFolder, '/home/ana/giz/projetos');
  assert.deepEqual(made, ['/home/ana/giz/projetos']);
  assert.equal(grants.require('/home/ana/giz/projetos/cupom'), '/home/ana/giz/projetos/cupom');
});

test('a picked projects folder is used; a cancelled pick changes nothing', async () => {
  const picked = settingsService('/dados/videos');
  assert.equal((await picked.service.projectsFolder('pick')).projectsFolder, '/dados/videos');
  const cancelled = settingsService(null);
  assert.equal((await cancelled.service.projectsFolder('pick')).projectsFolder, null);
  assert.equal(cancelled.app.writes, 0);
  assert.deepEqual(cancelled.made, []);
});

test('the models folder goes to giz.config.json, picked or back to core default', async () => {
  const { service, shared, made } = settingsService('/discos/modelos');
  assert.equal((await service.modelsFolder('pick')).modelsDir, '/discos/modelos');
  assert.equal((await service.modelsFolder('default')).modelsDir, CORE_DEFAULTS.modelsDir);
  assert.deepEqual(shared.writes, [{ modelsDir: '/discos/modelos' }, { modelsDir: CORE_DEFAULTS.modelsDir }]);
  assert.deepEqual(made, ['/discos/modelos', CORE_DEFAULTS.modelsDir]);
});

test('finish ends the first run; restore applies the saved language and grants the saved projects folder', async () => {
  const { service, app } = settingsService();
  await service.update({ language: 'pt-BR' });
  await service.projectsFolder('default');
  assert.equal((await service.finish()).firstRun, false);
  const again = settingsService();
  again.app.config = app.config;
  await again.service.restore();
  assert.deepEqual(again.languages, ['pt-BR']);
  assert.equal(again.grants.require('/home/ana/giz/projetos/x'), '/home/ana/giz/projetos/x');
});

test('changes made at the same time all survive (the read-modify-writes run one at a time)', async () => {
  const { service, app } = settingsService(null, 5);
  await Promise.all([
    service.update({ language: 'pt-BR' }),
    service.update({ providers: { text: 'gemini' } }),
    service.update({ providers: { voice: 'fish' } }),
    service.projectsFolder('default'),
  ]);
  assert.equal(app.config?.language, 'pt-BR');
  assert.deepEqual(app.config?.providers, { text: 'gemini', image: 'openai', voice: 'fish' });
  assert.equal(app.config?.projectsFolder, '/home/ana/giz/projetos');
  await service.finish();
  assert.equal(app.config?.language, 'pt-BR');
});

test('a tour seen is remembered once in the app config; "show the tours again" forgets them all', async () => {
  const { service, app, shared } = settingsService();
  assert.deepEqual((await service.tourSeen('script')).toursSeen, ['script']);
  assert.deepEqual((await service.tourSeen('script')).toursSeen, ['script'], 'seen twice is still one entry');
  assert.deepEqual(app.config?.toursSeen, ['script']);
  assert.deepEqual(shared.writes, [], 'the tours are the Studio\'s own, never in giz.config.json');
  assert.deepEqual((await service.resetTours()).toursSeen, []);
  assert.deepEqual(app.config?.toursSeen, []);
});

test('a tour seen during the first run keeps the other choices of the app config', async () => {
  const { service, app } = settingsService();
  await service.update({ language: 'pt-BR' });
  await Promise.all([service.tourSeen('script'), service.update({ providers: { text: 'gemini' } })]);
  assert.equal(app.config?.language, 'pt-BR');
  assert.equal(app.config?.providers.text, 'gemini');
  assert.deepEqual(app.config?.toursSeen, ['script']);
});
