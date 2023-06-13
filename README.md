# eslint-config

Common eslint config for all node.js repositories

## Install

```bash
$ npx install-peerdeps --dev https://github.com/1inch/eslint-config.git#latest
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