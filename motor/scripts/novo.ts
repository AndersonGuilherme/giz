// Cria a estrutura de um curso novo ou de uma aula nova a partir de _template/.
// Uso:
//   npm run novo-curso -- <slug-do-curso> "Título do curso"
//   npm run nova-aula  -- <slug-do-curso> <slug-da-aula> "Título da aula"     (número NN automático)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const template = join(root, '_template');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(msg: string): never { console.error(`erro: ${msg}`); process.exit(1); }
function checkSlug(s: string | undefined, what: string): string {
  if (!s) fail(`informe o ${what}`);
  if (!SLUG.test(s)) fail(`${what} "${s}" inválido: use minúsculas, números e hífens (ex.: logica-de-programacao)`);
  return s;
}

// copia a pasta trocando {{CHAVE}} pelos valores em todos os arquivos de texto
function copyFilled(src: string, dst: string, vars: Record<string, string>) {
  cpSync(src, dst, { recursive: true, errorOnExist: true, force: false });
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  for (const f of walk(dst)) {
    let s = readFileSync(f, 'utf8');
    // em .ts os valores entram entre aspas simples: escapa ' e \\
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{{${k}}}`, f.endsWith('.ts') ? v.replace(/[\\']/g, '\\$&') : v);
    writeFileSync(f, s);
  }
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'curso') {
  const curso = checkSlug(args[0], 'slug do curso');
  const titulo = args[1] ?? fail('informe o título do curso entre aspas');
  const dir = join(root, 'cursos', curso);
  if (existsSync(dir)) fail(`o curso já existe: ${relative(root, dir)}`);
  copyFilled(join(template, 'curso'), dir, { CURSO: curso, CURSO_TITULO: titulo });
  mkdirSync(join(dir, 'aulas'), { recursive: true });
  console.log(`curso criado: ${relative(root, dir)}/`);
  console.log(`próximos passos:\n  1. preencha ${relative(root, dir)}/plano-do-curso.md\n  2. npm run nova-aula -- ${curso} minha-primeira-aula "Título da aula"`);
} else if (cmd === 'aula') {
  const curso = checkSlug(args[0], 'slug do curso');
  const slug = checkSlug(args[1], 'slug da aula');
  const titulo = args[2] ?? fail('informe o título da aula entre aspas');
  const cursoDir = join(root, 'cursos', curso);
  if (!existsSync(cursoDir)) fail(`curso "${curso}" não existe; crie com: npm run novo-curso -- ${curso} "Título do curso"`);
  const aulas = join(cursoDir, 'aulas');
  mkdirSync(aulas, { recursive: true });
  // número = maior existente + 1; largura vem de curso.yaml (lesson_digits: 3 para cursos com 100+ aulas) ou das pastas
  const prefixes = readdirSync(aulas).map((d) => /^(\d+)-/.exec(d)?.[1]).filter((p): p is string => !!p);
  const yaml = existsSync(join(cursoDir, 'curso.yaml')) ? readFileSync(join(cursoDir, 'curso.yaml'), 'utf8') : '';
  const digits = Number(/^lesson_digits:\s*(\d+)/m.exec(yaml)?.[1] ?? Math.max(2, ...prefixes.map((p) => p.length)));
  const nums = prefixes.map(Number);
  const numero = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(digits, '0');
  const dir = join(aulas, `${numero}-${slug}`);
  copyFilled(join(template, 'aula'), dir, { CURSO: curso, NUMERO: numero, SLUG: slug, TITULO: titulo });
  const rel = relative(root, dir);
  console.log(`aula criada: ${rel}/  (roteiro de exemplo que já renderiza)`);
  console.log(`próximos passos:\n  1. escreva ${rel}/plano.md\n  2. troque o conteúdo de ${rel}/roteiro.ts e de exemplos/`);
  console.log(`  3. npm run check -- ../${rel}\n  4. npm run render -- ../${rel}`);
} else {
  console.error('uso:\n  npm run novo-curso -- <slug-do-curso> "Título do curso"\n  npm run nova-aula -- <slug-do-curso> <slug-da-aula> "Título da aula"');
  process.exit(2);
}
