# Custom Gate Hooks

Place custom hook scripts here to extend VANTAGE gate validation.

## How It Works

The gate-hooks runtime checks this directory when a hook name does not match a built-in validator. Each file should be named `<hook-name>.js` and export a default async function.

## Creating a Custom Hook

1. Create a file named after your hook, e.g. `my-custom-check.js`
2. Export a default async function that receives `(config, context)`
3. Return an object with `{ ok: boolean, msg: string }`

### Example

```js
// .vantage/hooks/check-env-vars.js
export default async function (config, context) {
  const required = ['DATABASE_URL', 'API_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    return { ok: false, msg: `Missing env vars: ${missing.join(', ')}` };
  }
  return { ok: true, msg: 'All required env vars present' };
}
```

### Parameters

- `config` — The full project config object (from `.vantage/config.yml`)
  - `config.project.root` — Project root directory
  - `config.gates.timeout_ms` — Configured timeout
- `context` — Execution context
  - `context.gate` — Current gate (e.g. `"G3"`)
  - `context.phase` — `"pre"` or `"post"`

### Return Value

```js
{ ok: true,  msg: 'Description of success' }
{ ok: false, msg: 'Description of failure' }
```

## Registering Hooks

Add your hook name to the gate config in `.vantage/config.yml`:

```yaml
gates:
  hooks:
    G3:
      pre: [validate-spec-contracts, check-env-vars]
      post: [log-gate-result]
```

## Shell Commands as Hooks

You can also use shell commands directly as hook names in config.yml:

```yaml
gates:
  hooks:
    G3:
      pre: [npm test, npm run lint]
```

Shell commands are executed with the configured timeout (default 30s) and run
with `cwd` set to the project root.

## Built-in Hooks

These are always available without custom files:

| Hook | Gate | Description |
|------|------|-------------|
| `validate-spec-completeness` | G0 | Checks specs/ has 8+ spec types |
| `validate-arch-specs-consistency` | G1 | Checks for domain-model or ADR files |
| `validate-stride-checklist` | G2 | Checks security-controls.md for STRIDE |
| `validate-controls-matrix` | G2 | Checks security-controls.md exists |
| `validate-spec-contracts` | G3 | Checks for OpenAPI spec |
| `validate-coverage` | G4 | Checks for coverage report |
| `validate-sast` | G4 | Checks for SAST report |
| `validate-docs-complete` | G5 | Checks README.md and API docs |
| `validate-pipeline` | G5 | Checks for CI/CD config |
| `log-gate-result` | all | Appends result to gate log |
| `update-sprint-status` | G3 | Placeholder for sprint updates |
| `generate-qa-report` | G4 | Placeholder for QA report |
