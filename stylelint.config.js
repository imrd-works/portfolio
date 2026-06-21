/** @type {import('stylelint').Config} */
export default {
  plugins: ['stylelint-selector-bem-pattern'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'plugin/selector-bem-pattern': {
      preset: 'bem',
      utilitySelectors: /^\.([a-z][a-z0-9-]*)$/,
      ignoreSelectors: [
        /^:root$/,
        /^\.\[data-v-[\w-]+\]$/,
        /^\*$/,
        /\.router-link-active$/,
        /^\.fade-enter-active$/,
        /^\.fade-leave-active$/,
        /^\.fade-enter-from$/,
        /^\.fade-leave-to$/,
      ],
    },
  },
  ignoreFiles: [
    'node_modules',
    'dist',
    '**/tokens/**',
    '**/base/_reset.scss',
    '**/base/_fonts.scss',
    '**/base/_utils.scss',
  ],
}
