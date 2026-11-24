import type { Option } from './prompts.ts';

// pt-BR pronunciation error measured with Whisper (`giz qa voices`, 4 sentences): lower = clearer.
export const VOICES: ReadonlyArray<Option<string> & Readonly<{ gender: 'f' | 'm' }>> = [
  { value: 'vivian', label: 'vivian   — feminina, jovem e marcante · pt-BR muito claro (erro 2,6%)', gender: 'f' },
  { value: 'ono_anna', label: 'ono_anna — feminina, leve e brincalhona · pt-BR muito claro (erro 2,6%)', gender: 'f' },
  { value: 'serena', label: 'serena   — feminina, calorosa e suave · pt-BR bom (erro 7,7%)', gender: 'f' },
  { value: 'sohee', label: 'sohee    — feminina, calorosa e expressiva · pt-BR com sotaque (erro 12,8%)', gender: 'f' },
  { value: 'dylan', label: 'dylan    — masculina, jovem e natural · pt-BR muito claro (erro 2,6%)', gender: 'm' },
  { value: 'ryan', label: 'ryan     — masculina, dinâmica e ritmada · pt-BR claro (erro 5,1%)', gender: 'm' },
  { value: 'eric', label: 'eric     — masculina, viva e levemente rouca · pt-BR bom (erro 7,7%)', gender: 'm' },
  { value: 'aiden', label: 'aiden    — masculina, clara e ensolarada · pt-BR com sotaque (erro 12,8%)', gender: 'm' },
  { value: 'uncle_fu', label: 'uncle_fu — masculina, grave e madura · pt-BR com sotaque (erro 12,8%)', gender: 'm' },
];

export const LANGUAGES = ['portuguese', 'english', 'spanish', 'french', 'german', 'italian', 'russian', 'japanese', 'korean', 'chinese'];

export const DEFAULT_STYLES = {
  lia: 'Fale em português do Brasil, com sotaque brasileiro de São Paulo, de forma calorosa e natural, como uma professora conversando',
  teo: 'Fale em português do Brasil, com sotaque brasileiro de São Paulo, com curiosidade e naturalidade, como um jovem desenvolvedor conversando',
};

export const LICENSES: readonly Option<'pessoa-fisica' | 'empresa-ate-3' | 'empresa-com-licenca'>[] = [
  { value: 'pessoa-fisica', label: 'eu, como pessoa física' },
  { value: 'empresa-ate-3', label: 'uma empresa com até 3 pessoas' },
  { value: 'empresa-com-licenca', label: 'uma empresa maior que já tem a licença do Remotion' },
];
