# Pinky customization guide

## After install

Reopen your agent (new chat / reload window) so it picks up `AGENTS.md`, rules, and skills.

## Safer re-runs

Prefer cloning the kit, then installing locally (no remote pipe):

```bash
git clone https://github.com/Haroon966/pinky-cursor.git
cd your-project
bash /path/to/pinky-cursor/install.sh --no-ui
```

```bash
bash install.sh --dry-run          # preview paths; write nothing
bash install.sh                    # first install, or write *.pinky* siblings when targets exist
bash install.sh --force            # replace existing Pinky-owned files (rules, skills, AGENTS.md, …)
bash install.sh --no-ui            # skip UI UX Pro Max
bash install.sh --agents=cursor,claude
```

Without `--force`, existing files are kept and a sibling is written (`AGENTS.pinky.md`, `.cursor/rules/01-core.pinky.mdc`, `skills/caveman.pinky/`, …). Merge manually or re-run with `--force`.

## Trim what you don’t need

| Goal | Action |
|------|--------|
| No Caveman prose | Delete `.cursor/rules/caveman.mdc` and `skills/caveman/` copies; edit Communication section out of `AGENTS.md` |
| No Ponytail | Remove `ponytail.mdc` and ladder section from `AGENTS.md` |
| Frontend-only | Delete `05-frontend.mdc` / `frontend-craft` skill copies |
| Backend-only | Delete `06-backend.mdc` / `backend-apis` |
| No grill skills | Remove `grill-me` and `grill-with-docs` under skill dirs |

## grill-me vs grill-with-docs

- `/grill-me` — interview only; no files written
- `/grill-with-docs` — same interview; writes `CONTEXT.md` glossary and sparse `docs/adr/` ADRs

## Stack-specific rules

Add your own `.cursor/rules/my-stack.mdc` (or host equivalent) with globs for your framework. Keep Pinky rules stack-agnostic.

## UI UX Pro Max refresh

```bash
npx uipro-cli@latest init --ai all
```

(`@latest` is unpinned — pin a version in your own docs if you need reproducibility.)

## Sync after editing the kit

Canonical sources: `AGENTS.md`, `adapters/shared/pinky-full.md`, `skills/`, `adapters/cursor/`. After changing the spine or full profile, regenerate host adapters:

```bash
bash scripts/sync-adapters.sh
```

Then re-run `install.sh` in consumer projects (with `--force` to replace existing Pinky files).
