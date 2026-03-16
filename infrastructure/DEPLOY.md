# Deploy target and profile

All CDK and AWS CLI commands must use this target so we never deploy to the wrong account.

| Setting   | Value           |
|----------|-----------------|
| **Profile** | `prime-deal-auto` |
| **Account** | `141814481613`   |
| **Region** | `us-east-1`      |

## How to deploy

From **repo root**:

```bash
npm run deploy --workspace=infrastructure
```

Or from **infrastructure**:

```bash
cd infrastructure
npm run deploy
```

- `deploy:guard` runs first and checks that `aws sts get-caller-identity --profile prime-deal-auto` returns account **141814481613**. If your profile points at another account, the script exits with an error and no stacks are deployed.
- CDK then runs with `--profile prime-deal-auto`. Stacks are defined in `bin/app.ts` with `env: { account: '141814481613', region: 'us-east-1' }`.

## Other commands

All of these use `--profile prime-deal-auto`:

- `npm run synth --workspace=infrastructure` — synthesize templates
- `npm run diff --workspace=infrastructure` — diff against deployed stacks
- `npm run deploy:database` / `npm run deploy:api` — deploy single stacks (guard runs first)

Never run `cdk deploy` or `cdk destroy` without `--profile prime-deal-auto` (or without going through these npm scripts).
