const path = require('path')

const getPluginPath = (plugin, filepath) => path.resolve(
    path.dirname(
        require.resolve(`./node_modules/${plugin}`),
    ),
    filepath
);

    [
    getPluginPath('@eslint/js', 'configs/eslint-recommended.js'),
        getPluginPath('@typescript-eslint/eslint-plugin', 'configs/recommended.js'),
        getPluginPath('eslint-config-prettier', 'index.js'),
    ].map(f => console.log(f))

module.exports = {
    root: true,
    env: {
        node: true
    },
    ignorePatterns: ['*.mock.ts'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'unused-imports'],
    extends: [
        getPluginPath('@eslint/js', 'configs/eslint-recommended'),
        getPluginPath('@typescript-eslint/eslint-plugin', 'configs/recommended.js'),
        getPluginPath('eslint-config-prettier', 'index.js'),
    ],
    rules: {
        '@typescript-eslint/member-ordering': 'error',
        'lines-between-class-members': 'error',
        'padding-line-between-statements': [
            'error',
            {blankLine: 'always', prev: '*', next: 'return'},
            {blankLine: 'always', prev: '*', next: 'if'},
            {blankLine: 'always', prev: 'if', next: '*'},
            {blankLine: 'always', prev: 'for', next: '*'},
            {blankLine: 'always', prev: '*', next: 'for'}
        ],
        '@typescript-eslint/adjacent-overload-signatures': 'off',
        'no-unused-vars': 'off',
        'no-prototype-builtins': 'off',
        'max-len': ['error', {code: 160, ignoreComments: true}],
        'max-depth': ['error', 3],
        'max-lines-per-function': ['error', 255],
        'max-params': ['error', 10],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {argsIgnorePattern: '^_'}
        ],
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': 0,
        'no-async-promise-executor': 0,
        'no-console': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-non-null-assertion': 'off'
    },
    overrides: [
        {
            files: ['src/**/*.spec.ts'],
            rules: {
                'max-lines-per-function': ['error', 400],
                'max-len': ['error', {code: 1130}]
            }
        }
    ]
}
