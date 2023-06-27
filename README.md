# eslint-config

Common eslint config for all node.js repositories

## Install

```bash
$ yarn add -D https://github.com/1inch/eslint-config.git#latest \
  @typescript-eslint/eslint-plugin@5.59 \
  @typescript-eslint/parser@5.51 \
  eslint-config-prettier@8.3 \
  eslint-config-standard@17 \
  eslint-plugin-import@2.26 \
  eslint-plugin-n@16 \
  eslint-plugin-prettier@4 \
  eslint-plugin-promise@6 \
  eslint-plugin-unused-imports@2 \
  eslint-import-resolver-typescript@3.5.5
```

And then setup `.eslintrc`:
```json
{
  "extends": ["@1inch"]
}
```

## Release new version

```bash
# patch
$ yarn release --patch

# minot
$ yarn release --minor

# major
$ yarn release --major

# exact
$ yarn release v1.0.0
```