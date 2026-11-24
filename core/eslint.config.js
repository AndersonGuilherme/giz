import tseslint from 'typescript-eslint';

const calisthenicsRules = {
  'max-depth': ['error', 1],
  'no-else-return': 'error',
  'no-restricted-syntax': [
    'error',
    { selector: 'IfStatement[alternate]', message: 'No else: use an early return or polymorphism.' },
  ],
  'max-lines': ['error', { max: 150, skipBlankLines: false, skipComments: false }],
  'max-lines-per-function': ['error', { max: 20, skipBlankLines: false, skipComments: false }],
  'max-params': ['error', 3],
  complexity: ['error', 6],
  'id-length': ['error', { min: 2, exceptions: ['x', 'y'] }],
};

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'public/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommended],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: calisthenicsRules,
  },
  {
    files: ['test/**/*.ts', 'test/**/*.tsx'],
    rules: { 'id-length': 'off', 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },
);
