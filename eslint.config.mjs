import { createNextConfig } from './eslint.base.mjs';

const nativeInteractiveElements = [
  'a',
  'button',
  'dialog',
  'input',
  'label',
  'option',
  'select',
  'textarea',
];

const nativeInteractiveSelectors = nativeInteractiveElements.map((element) => ({
  message: `Use the corresponding component from @/components/ui instead of native <${element}>.`,
  selector: `JSXOpeningElement[name.name='${element}']`,
}));

const nativeCreateElementSelectors = nativeInteractiveElements.flatMap((element) => [
  {
    message: `Use the corresponding component from @/components/ui instead of native ${element}.`,
    selector: `CallExpression[callee.name='createElement'][arguments.0.value='${element}']`,
  },
  {
    message: `Use the corresponding component from @/components/ui instead of native ${element}.`,
    selector: `CallExpression[callee.object.name='React'][callee.property.name='createElement'][arguments.0.value='${element}']`,
  },
]);

// "Magic" glyphs are the house style of generated interfaces and name nothing.
// DESIGN.md: The No Sparkles rule.
const bannedDecorativeIcons = ['Sparkle', 'Sparkles', 'Wand', 'Wand2', 'WandSparkles'];

const bannedIconSelectors = bannedDecorativeIcons.map((icon) => ({
  message: `${icon} is banned — pick an icon that names the thing (DESIGN.md: The No Sparkles rule).`,
  selector: `ImportDeclaration[source.value=/^lucide-react/] ImportSpecifier[imported.name='${icon}']`,
}));

const vitestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  suite: 'readonly',
  test: 'readonly',
  vi: 'readonly',
  vitest: 'readonly',
};

export default [
  ...createNextConfig({ ignores: ['frontend.old/**', 'schema.graphql'] }),
  {
    // Vitest runs with `globals: true`; declare them so no-undef stays useful.
    files: ['**/*.{test,spec}.{ts,tsx}', 'vitest.setup.ts'],
    languageOptions: {
      globals: vitestGlobals,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { message: 'Use a shadcn dialog or alert dialog instead.', name: 'alert' },
        { message: 'Use a shadcn alert dialog instead.', name: 'confirm' },
        { message: 'Use a shadcn dialog with validated fields instead.', name: 'prompt' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@base-ui/**', '@radix-ui/**'],
              message: 'Import the repository shadcn wrapper from @/components/ui instead.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          message: 'Use a shadcn dialog or alert dialog instead.',
          object: 'window',
          property: 'alert',
        },
        {
          message: 'Use a shadcn alert dialog instead.',
          object: 'window',
          property: 'confirm',
        },
        {
          message: 'Use a shadcn dialog with validated fields instead.',
          object: 'window',
          property: 'prompt',
        },
      ],
      'no-restricted-syntax': [
        'error',
        'ForInStatement',
        'LabeledStatement',
        'WithStatement',
        ...nativeInteractiveSelectors,
        ...nativeCreateElementSelectors,
        ...bannedIconSelectors,
      ],
    },
  },
];
