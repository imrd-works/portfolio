import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import pluginPrettier from 'eslint-plugin-prettier'
import pluginImport from 'eslint-plugin-import'
import noCyrillicPlugin from 'eslint-plugin-no-cyrillic-string'
import tsPlugin from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import eslintConfigPrettier from 'eslint-config-prettier'

const noCyrillicEnabled = process.env.ESLINT_NO_CYRILLIC !== '0'

export default [
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...pluginVue.configs['flat/strongly-recommended'],
  ...pluginVueA11y.configs['flat/recommended'],
  ...tsPlugin.configs.recommended,
  // eslint-config-prettier turns off ESLint's own stylistic rules; the prettier
  // plugin then reports formatting issues via the `prettier/prettier` rule.
  // Both read the project's .prettierrc (incl. `singleAttributePerLine`), so
  // ESLint and standalone Prettier stay in sync.
  eslintConfigPrettier,
  {
    plugins: { prettier: pluginPrettier },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsPlugin.parser,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['src/shared/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    rules: {
      'vue/attribute-hyphenation': 'error',
      'vue/component-definition-name-casing': 'error',
      'vue/html-end-tags': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/require-prop-types': 'error',
    },
  },
  {
    files: ['src/**/*.vue'],
    rules: {
      'vuejs-accessibility/alt-text': 'error',
      'vuejs-accessibility/anchor-has-content': 'error',
      'vuejs-accessibility/aria-props': 'error',
      'vuejs-accessibility/aria-role': 'error',
      'vuejs-accessibility/aria-unsupported-elements': 'error',
      'vuejs-accessibility/click-events-have-key-events': 'error',
      'vuejs-accessibility/form-control-has-label': 'error',
      'vuejs-accessibility/heading-has-content': 'error',
      'vuejs-accessibility/iframe-has-title': 'error',
      'vuejs-accessibility/interactive-supports-focus': 'error',
      'vuejs-accessibility/label-has-for': 'error',
      'vuejs-accessibility/media-has-caption': 'warn',
      'vuejs-accessibility/no-access-key': 'error',
      'vuejs-accessibility/no-aria-hidden-on-focusable': 'error',
      'vuejs-accessibility/no-autofocus': 'error',
      'vuejs-accessibility/no-redundant-roles': 'error',
      'vuejs-accessibility/no-static-element-interactions': 'error',
      'vuejs-accessibility/role-has-required-aria-props': 'error',
      'vuejs-accessibility/tabindex-no-positive': 'error',
    },
  },
  {
    plugins: { import: pluginImport },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
        node: true,
      },
      'import/ignore': ['virtual:.*', '\\.(scss|css)$'],
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^virtual:'] }],
    },
  },
  ...(noCyrillicEnabled
    ? [
        {
          files: ['src/**/*.ts', 'src/**/*.vue'],
          ignores: ['**/locales/**', '**/*.json'],
          plugins: { 'no-cyrillic-string': noCyrillicPlugin },
          rules: {
            'no-cyrillic-string/no-cyrillic-string': 'error',
          },
        },
      ]
    : []),
]
