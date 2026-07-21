# Pinky agent compatibility

After `install.sh`, these paths exist so every major coding agent can load Pinky + Ponytail + Caveman.

## Depth tiers

| Tier | What you get | Hosts |
|------|----------------|-------|
| **Full** | Cursor `.mdc` rules (core, Ponytail, Caveman, architecture, testing, FE/BE) + skills | Cursor |
| **Instructions + skills** | Host instruction file (`AGENTS.md` spine + full profile) and/or skill dirs | Claude Code, Codex, Copilot, Windsurf, Cline, Kiro, Qoder, Junie, Aider, OpenClaw/Agents, Gemini (skills) |
| **AGENTS.md only** | Universal spine file; host must read `AGENTS.md` | Amp, Jules, Zed, and other AGENTS.md scanners |

Cursor is the deepest profile. Other instruction adapters are generated from `AGENTS.md` + `adapters/shared/pinky-full.md` via `scripts/sync-adapters.sh`.

## Always-on instructions

| Host | Path | Tier |
|------|------|------|
| Universal (Codex, Amp, Jules, Zed, Antigravity, Copilot CLI fallback, …) | `AGENTS.md` | AGENTS / +skills where listed below |
| Claude Code | `CLAUDE.md` (+ `AGENTS.md`) | Instructions + skills |
| Cursor | `.cursor/rules/*.mdc` | Full |
| GitHub Copilot (IDE) | `.github/copilot-instructions.md` | Instructions |
| Windsurf | `.windsurf/rules/pinky.md` | Instructions + skills |
| Cline | `.clinerules/pinky.md` | Instructions + skills |
| Kiro | `.kiro/steering/pinky.md` | Instructions |
| Qoder | `.qoder/rules/pinky.md` | Instructions |
| JetBrains Junie (legacy) | `.junie/guidelines.md` | Instructions |
| Aider | `CONVENTIONS.md` | Instructions |
| OpenClaw / generic | `.agents/rules/pinky.md` | Instructions + skills |

## Skills

Same skills are copied into:

| Host | Directory |
|------|-----------|
| Kit / root scanners | `skills/` |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| Agents / OpenClaw | `.agents/skills/` |
| Codex | `.codex/skills/` |
| Windsurf | `.windsurf/skills/` |
| Gemini / Antigravity | `.gemini/skills/` |
| Cline | `.cline/skills/` |

Skills included: `caveman`, `grill-me`, `grill-with-docs`, `frontend-craft`, `backend-apis`. UI UX Pro Max is installed via `uipro-cli` when Node/`npx` is available.

## Optional upstream plugins

Pinky’s file fan-out is enough for behavior. For marketplace plugins with hooks/mode switches:

- [Ponytail](https://github.com/DietrichGebert/ponytail) — Claude Code / Codex plugins
- [Caveman](https://github.com/JuliusBrussee/caveman) — `npx skills add JuliusBrussee/caveman`
