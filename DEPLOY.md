# Khmer Type Master — deploy & mount on krumath.com

App-specific values for the shared playbook in [`KRUMATH_GAME_INTEGRATION.md`](KRUMATH_GAME_INTEGRATION.md).

## This app

| Item | Value |
|------|--------|
| Repo | `khmer-type-master` (separate GitHub repo) |
| Public path | `/khmer-typing-master` |
| Vite `base` / Nitro `baseURL` | `/khmer-typing-master/` |
| Cloudflare Worker name | `khmer-typing-master` |
| Auth gate | **Soft** — practice open to everyone; `requireSignedInForAction` ready for future cloud save |
| Progress | `localStorage` now; Supabase sync stubbed in `src/lib/progress.ts` |

## Deploy (operator)

```sh
cp .env.example .env   # fill VITE_SUPABASE_* from KruMath
npm install
npm run deploy         # build + nitro deploy --prebuilt
```

Cloudflare hostname route (more specific than the main `krumath` Worker):

```text
krumath.com/khmer-typing-master*  →  khmer-typing-master
```

Smoke-test:

- [ ] `https://krumath.com/khmer-typing-master` loads
- [ ] Assets load from `/khmer-typing-master/assets/...` (not `/assets/...` on the main site)
- [ ] Practice works signed out
- [ ] (When a gated action exists) unsigned → `/sign-in?returnUrl=/khmer-typing-master`

## Phase C — KruMath maintainer only (not this repo)

Do **not** implement these from the feature-repo agent:

1. Add `/khmer-typing-master` to `FEATURE_APP_PATH_PREFIXES` / returnUrl allowlist
2. Add a `/home` game card linking to `/khmer-typing-master`
3. Only after the Worker route works

## Local URL

```text
http://localhost:5173/khmer-typing-master/
```
