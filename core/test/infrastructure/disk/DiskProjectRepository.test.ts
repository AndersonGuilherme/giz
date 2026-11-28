import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProjectError } from '../../../src/application/ports/ProjectError.ts';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { FakeRigCatalog } from '../../doubles/FakeRigCatalog.ts';

type Json = Record<string, unknown>;

const FIXTURES = fileURLToPath(new URL('../../fixtures/', import.meta.url));
const fixture = (name: string) => join(FIXTURES, name);
const repository = () => new DiskProjectRepository({ catalog: new FakeRigCatalog() });
const tempFolders: string[] = [];

after(() => Promise.all(tempFolders.map((folder) => rm(folder, { recursive: true, force: true }))));

async function changeFile(folder: string, file: string, change: (json: Json) => Json): Promise<void> {
  const path = join(folder, file);
  const json = JSON.parse(await readFile(path, 'utf8')) as Json;
  await writeFile(path, JSON.stringify(change(json)));
}

// The fixture uses the production rig (gizzy); these tests use the fake catalog, so the copy switches Ana to the "test" rig.
const ANA_ON_TEST_RIG: Json = { rig: 'test', parameters: { skin: '#f0c8a0' } };

async function changedCopy(file: string, change: (json: Json) => Json): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-project-'));
  tempFolders.push(folder);
  await cp(fixture('minimal-project'), folder, { recursive: true });
  await changeFile(folder, 'cast/ana.json', (json) => ({ ...json, ...ANA_ON_TEST_RIG }));
  await changeFile(folder, file, change);
  return folder;
}

const loadWith = async (file: string, change: (json: Json) => Json) =>
  repository().load(await changedCopy(file, change));
const loadWithProject = (partial: Json) => loadWith('project.json', (json) => ({ ...json, ...partial }));
const loadWithScript = (partial: Json) => loadWith('script.json', (json) => ({ ...json, ...partial }));
const loadWithCharacter = (partial: Json) => loadWith('cast/ana.json', (json) => ({ ...json, ...partial }));
const loadWithScene = (scene: Json) =>
  loadWith('script.json', (json) => {
    const [first, ...rest] = json.lines as Json[];
    return { ...json, lines: [{ ...first, scene }, ...rest] };
  });

async function capture(promise: Promise<unknown>): Promise<ProjectError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ProjectError, `expected ProjectError, got ${String(error)}`);
    return error;
  }
  assert.fail('expected ProjectError');
}

test('loads the minimal project', async () => {
  const p = await loadWithCharacter({});
  assert.equal(p.language().code(), 'pt-BR');
  assert.equal(p.script().lines().count(), 2);
  assert.ok(p.cast().contains(CharacterId.of('ana')));
  assert.equal(p.title(), 'Projeto mínimo');
  assert.equal(p.format(), 'story');
  assert.equal(p.aspect().text(), '9:16');
  assert.deepEqual(p.warnings(), []);
});
test('a line by a character outside the cast is a readable error', async () => {
  await assert.rejects(loadWithScript({ lines: [{ id: '1', chapter: 1, speaker: 'bia', text: 'oi' }] }),
    { name: 'ProjectError', message: /script\.json › lines\[0\]\.speaker: "bia" não está no elenco \(ana\)/ });
});
test('an invalid color in the character points at the file and field', async () => {
  await assert.rejects(loadWithCharacter({ parameters: { skin: 'roxo' } }), /cast\/ana\.json › parameters\.skin: cor "roxo"/);
});
test('several errors come out together, not only the first', async () => {
  const error = await capture(loadWithScript({ lines: [{ id: '1' }, { id: '2' }] }));
  assert.ok(error.problems.length >= 4);
});
test('a missing scenario image is a warning, not a load failure', async () => {
  const p = await loadWithScene({ type: 'scenario', background: { image: 'cenarios/nao-existe.png' }, characters: [] });
  assert.match(p.warnings().join('\n'), /cenarios\/nao-existe\.png não encontrada.*fala 1/);
});

test('a scenario image outside the project folder is refused with the field and a readable message', async () => {
  const outside = loadWithScene({ type: 'scenario', background: { image: '../../etc/passwd.png' }, characters: [] });
  await assert.rejects(outside, /script\.json › lines\[0\]\.scene\.background\.image: "\.\.\/\.\.\/etc\/passwd\.png" sai da pasta do projeto/);
  const absolute = loadWithScene({ type: 'scenario', background: { image: '/tmp/room.png' }, characters: [] });
  await assert.rejects(absolute, /background\.image: caminho absoluto "\/tmp\/room\.png"/);
});

test('a beat background image goes through the same path rules as the scene image', async () => {
  const beatImage = (image: string) => loadWith('script.json', (json) => {
    const [first, ...rest] = json.lines as Json[];
    return { ...json, lines: [{ ...first, text: 'Oi, [eu] sou a Ana.', beats: [{ background: { image } }] }, ...rest] };
  });
  await assert.rejects(beatImage('../../../../etc/passwd'),
    /script\.json › lines\[0\]\.beats\[0\]\.background\.image: "\.\.\/\.\.\/\.\.\/\.\.\/etc\/passwd" sai da pasta do projeto/);
  await assert.rejects(beatImage('/etc/passwd'), /beats\[0\]\.background\.image: caminho absoluto/);
  const p = await beatImage('scenarios/beat-missing.png');
  assert.match(p.warnings().join('\n'), /lines\[0\]\.beats\[0\]\.background\.image: scenarios\/beat-missing\.png não encontrada \(fala 1\)/);
});
test('with the qwen voice, a cast voice that Qwen does not have is an error naming the valid voices', async () => {
  await assert.rejects(loadWithCharacter({ voice: { id: 'roberto' } }),
    /cast\/ana\.json › voice\.id: a voz "roberto" não existe no Qwen \(use serena, vivian, uncle_fu, ryan, aiden, ono_anna, sohee, eric, dylan\)/);
});
test('with recordings, any voice id is fine, and a missing or broken recording is a warning naming the file and the line', async () => {
  const folder = await changedCopy('project.json', (json) => ({ ...json, voice: { provider: 'recording' } }));
  await changeFile(folder, 'cast/ana.json', (json) => ({ ...json, voice: { id: 'minha-voz' } }));
  await mkdir(join(folder, 'recordings'));
  await writeFile(join(folder, 'recordings', '2.wav'), 'não é wav');
  const warnings = (await repository().load(folder)).warnings().join('\n');
  assert.match(warnings, /recordings\/1\.wav: gravação não encontrada \(fala 1\): grave "Oi, eu sou a Ana\."/);
  assert.match(warnings, /recordings\/2\.wav: gravação inválida \(fala 2\): não é um arquivo WAV/);
});
test('with the qwen voice, recordings are not looked at', async () => {
  const p = await loadWithProject({});
  assert.doesNotMatch(p.warnings().join('\n'), /recordings/);
});

test('with an external voice service, the cast voice is the service voice id (no Qwen check)', async () => {
  const folder = await changedCopy('project.json', (json) => ({ ...json, voice: { provider: 'elevenlabs' } }));
  await changeFile(folder, 'cast/ana.json', (json) => ({ ...json, voice: { id: 'EXAVITQu4vr4xnSDxMaL' } }));
  const project = await repository().load(folder);
  assert.equal(project.voice().provider, 'elevenlabs');
});
test('the pronunciation dictionary of the service: pronunciation.json for qwen, pronunciation.<service>.json for the others', async () => {
  const folder = await changedCopy('project.json', (json) => json);
  await writeFile(join(folder, 'pronunciation.json'), JSON.stringify({ Ana: 'Âna' }));
  await writeFile(join(folder, 'pronunciation.fish.json'), JSON.stringify({ Ana: 'Anna' }));
  assert.equal((await repository().load(folder)).lexicon().apply('Oi, Ana'), 'Oi, Âna');
  await changeFile(folder, 'project.json', (json) => ({ ...json, voice: { provider: 'fish' } }));
  assert.equal((await repository().load(folder)).lexicon().apply('Oi, Ana'), 'Oi, Anna');
  await changeFile(folder, 'project.json', (json) => ({ ...json, voice: { provider: 'elevenlabs' } }));
  assert.equal((await repository().load(folder)).lexicon().apply('Oi, Ana'), 'Oi, Ana');
});
test('recordings use no pronunciation dictionary; a broken dictionary is an error naming the file', async () => {
  const folder = await changedCopy('project.json', (json) => ({ ...json, voice: { provider: 'recording' } }));
  await writeFile(join(folder, 'pronunciation.json'), JSON.stringify({ Ana: 'Âna' }));
  assert.equal((await repository().load(folder)).lexicon().apply('Ana'), 'Ana');
  await changeFile(folder, 'project.json', (json) => ({ ...json, voice: { provider: 'qwen' } }));
  await writeFile(join(folder, 'pronunciation.json'), JSON.stringify({ Ana: 3 }));
  await assert.rejects(repository().load(folder), /pronunciation\.json › Ana/);
});

test('a missing required field gives the path', async () => {
  const error = await capture(loadWithScript({ lines: [{ id: '1', chapter: 1, speaker: 'ana' }] }));
  assert.match(error.message, /script\.json › lines\[0\]\.text: obrigatório/);
});
test('a missing chapter is an error', async () => {
  await assert.rejects(loadWithScript({ lines: [{ id: '1', chapter: 3, speaker: 'ana', text: 'oi' }] }),
    /lines\[0\]\.chapter: capítulo 3 não existe \(há 1\)/);
});
test('a line id that could leave the voice folder is refused with the field; a plain id loads', async () => {
  const withFirstId = (id: string) => loadWith('script.json', (json) => {
    const [first, ...rest] = json.lines as Json[];
    return { ...json, lines: [{ ...first, id }, ...rest] };
  });
  await assert.rejects(withFirstId('../x'), /script\.json › lines\[0\]\.id: id de fala "\.\.\/x" inválido/);
  await assert.rejects(withFirstId('../../x'), /lines\[0\]\.id: id de fala "\.\.\/\.\.\/x" inválido/);
  await assert.rejects(withFirstId('a/b'), /lines\[0\]\.id: id de fala "a\/b" inválido/);
  await assert.rejects(withFirstId(''), /lines\[0\]\.id: id de fala "" inválido/);
  const p = await withFirstId('intro_1');
  assert.equal(p.script().lines().each()[0]?.id(), 'intro_1');
});
test('repeated line ids are an error', async () => {
  const lines = [{ id: '1', chapter: 1, speaker: 'ana', text: 'oi' }, { id: '1', chapter: 1, speaker: 'ana', text: 'de novo' }];
  await assert.rejects(loadWithScript({ lines }), /lines\[1\]\.id: id "1" repetido/);
});
test('an unknown field is an error', async () => {
  await assert.rejects(loadWithProject({ color: 'azul' }), /project\.json › color: campo desconhecido/);
});
test('an invalid language uses the domain message', async () => {
  await assert.rejects(loadWithProject({ language: 'es' }), /project\.json › language: idioma "es" não suportado/);
});
test('a missing character file is an error', async () => {
  await assert.rejects(loadWithProject({ cast: ['ana', 'bia'] }), /cast\/bia\.json: arquivo não encontrado/);
});
test('a character id different from the file is an error', async () => {
  await assert.rejects(loadWithCharacter({ id: 'bia' }), /cast\/ana\.json › id: "bia" difere do nome do arquivo \(ana\)/);
});
test('an unknown rig lists the valid rigs', async () => {
  await assert.rejects(loadWithCharacter({ rig: 'robo' }), /cast\/ana\.json › rig: rig "robo" desconhecido \(use test\)/);
});
test('an unknown rig parameter is an error', async () => {
  await assert.rejects(loadWithCharacter({ parameters: { wings: true } }),
    /parameters\.wings: parâmetro desconhecido no rig "test" \(use skin, height, hair, glasses\)/);
});
test('an out-of-range number and an invalid option come out together', async () => {
  const error = await capture(loadWithCharacter({ parameters: { height: 3, hair: 'roxo', glasses: 'sim' } }));
  assert.match(error.message, /parameters\.height: número 3 fora de 0\.5 a 1\.5/);
  assert.match(error.message, /parameters\.hair: opção "roxo" inválida \(use short, long\)/);
  assert.match(error.message, /parameters\.glasses: esperava verdadeiro ou falso, veio "sim"/);
});
test('missing parameters get the rig default', async () => {
  const p = await loadWithCharacter({ parameters: { height: 1.2 } });
  const ana = p.cast().character(CharacterId.of('ana'));
  assert.deepEqual(ana.parameters(), { skin: '#f0c8a0', height: 1.2, hair: 'short', glasses: false });
});
test('an unknown scene type lists the types', async () => {
  await assert.rejects(loadWithScene({ type: 'casa' }), /lines\[0\]\.scene\.type: tipo inválido \(use scenario, title,/);
});
test('a character on stage outside the cast is an error', async () => {
  const scene = { type: 'scenario', background: {}, characters: [{ character: 'bia', position: { x: 0.5, y: 0.8 } }] };
  await assert.rejects(loadWithScene(scene), /lines\[0\]\.scene\.characters\[0\]\.character: "bia" não está no elenco \(ana\)/);
});
test('an embedded code scene and a full scenario load', async () => {
  const code = { type: 'code', title: 'soma.ts', lines: ['const a = 1;', 'const b = 2;'], added: [1], highlight: ['b'] };
  const p = await loadWithScene(code);
  assert.deepEqual(p.script().lines().each()[0].scene(), code);
  const scenario = {
    type: 'scenario', background: { vector: 'sala', colors: { wall: '#ffeedd' } },
    characters: [{ character: 'ana', position: 'left', scale: 1.1, direction: 'right' }],
    camera: { type: 'zoom-in', from: { x: 0, y: 0, zoom: 1 }, to: { x: 0.2, y: 0.1, zoom: 1.4 }, easing: 'smooth' },
    effects: [{ type: 'vignette', intensity: 0.4 }, { type: 'glow', color: '#ffffff', position: { x: 0.5, y: 0.2 } }],
    hud: { fields: [{ label: 'Vida', value: '3' }], bar: { label: 'Energia', value: 80 } },
    highlight: { text: 'UAU', color: '#ff0000', entrance: 'pop' },
  };
  await loadWithScene(scenario);
});
test('an invalid color inside the scene points at the path', async () => {
  const scene = { type: 'scenario', background: { colors: { wall: 'bege' } }, characters: [] };
  await assert.rejects(loadWithScene(scene), /lines\[0\]\.scene\.background\.colors\.wall: cor "bege" inválida/);
});
test('a background color key the vector background does not have is an error naming the valid keys', async () => {
  const scene = { type: 'scenario', background: { vector: 'graveyard', colors: { moon: '#ffeedd', mooon: '#ffeedd' } }, characters: [] };
  await assert.rejects(loadWithScene(scene), /lines\[0\]\.scene\.background\.colors\.mooon: cor desconhecida no fundo "graveyard" \(use skyTop, skyBottom, star, moon,/);
});
test('colors without a vector are checked against the room, the background actually drawn', async () => {
  const scene = { type: 'scenario', background: { colors: { wall: '#ffeedd', skyTop: '#000000' } }, characters: [] };
  await assert.rejects(loadWithScene(scene), /background\.colors\.skyTop: cor desconhecida no fundo "room" \(use wall,/);
});
test('a HUD bar above 100 is an error', async () => {
  const scene = { type: 'scenario', background: {}, characters: [], hud: { fields: [], bar: { label: 'x', value: 120 } } };
  await assert.rejects(loadWithScene(scene), /scene\.hud\.bar\.value: deve ser no máximo 100/);
});
test('an effect intensity above 3 is an error with its path', async () => {
  const scene = { type: 'scenario', background: {}, characters: [], effects: [{ type: 'rain', intensity: 100 }] };
  await assert.rejects(loadWithScene(scene), /scene\.effects\[0\]\.intensity: deve ser no máximo 3/);
});

const NARRATOR = { id: 'narrator', name: 'Narrador', voice: { id: 'eric' }, defaultExpression: 'neutral' };
async function folderWithNarrator(changeScript: (json: Json) => Json = (json) => json): Promise<string> {
  const folder = await changedCopy('project.json', (json) => ({ ...json, cast: ['ana', 'narrator'] }));
  await writeFile(join(folder, 'cast/narrator.json'), JSON.stringify(NARRATOR));
  const path = join(folder, 'script.json');
  await writeFile(path, JSON.stringify(changeScript(JSON.parse(await readFile(path, 'utf8')) as Json)));
  return folder;
}
test('a narrator without a rig loads as a voice without a body', async () => {
  const folder = await folderWithNarrator((json) => ({
    ...json, lines: [...(json.lines as Json[]), { id: '3', chapter: 1, speaker: 'narrator', text: 'Era uma vez.' }],
  }));
  const p = await repository().load(folder);
  const narrator = p.cast().character(CharacterId.NARRATOR);
  assert.equal(narrator.hasBody(), false);
  assert.ok(p.cast().character(CharacterId.of('ana')).hasBody());
});
test('a narrator on stage is a readable error', async () => {
  const folder = await folderWithNarrator((json) => {
    const [first, ...rest] = json.lines as Json[];
    const scene = { type: 'scenario', background: {}, characters: [{ character: 'narrator', position: 'center' }] };
    return { ...json, lines: [{ ...first, scene }, ...rest] };
  });
  await assert.rejects(repository().load(folder),
    /lines\[0\]\.scene\.characters\[0\]\.character: narrator não tem corpo e não pode aparecer em cena/);
});
test('a character without a rig that is not the narrator is an error', async () => {
  await assert.rejects(loadWithCharacter({ rig: undefined }),
    /cast\/ana\.json › rig: obrigatório \(só o narrador pode não ter rig\)/);
});
test('a narrator without a rig but with parameters is an error', async () => {
  const folder = await folderWithNarrator();
  await writeFile(join(folder, 'cast/narrator.json'), JSON.stringify({ ...NARRATOR, parameters: { skin: '#000' } }));
  await assert.rejects(repository().load(folder), /cast\/narrator\.json › parameters: o narrador sem rig não tem parâmetros/);
});
test('captionStyle is optional: without it the format picks the default, with it the declared style wins', async () => {
  const omit = (json: Json) => Object.fromEntries(Object.entries(json).filter(([key]) => key !== 'captionStyle'));
  assert.equal((await loadWith('project.json', omit)).captionStyle(), 'words');
  assert.equal((await loadWith('project.json', (json) => ({ ...omit(json), format: 'lesson' }))).captionStyle(), 'blocks');
  assert.equal((await loadWithProject({ captionStyle: 'blocks' })).captionStyle(), 'blocks');
});
