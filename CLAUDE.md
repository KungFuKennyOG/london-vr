# London VR: notes for Claude

- Read `docs/HANDOFF.md` first; the claude.ai Project "VR GTA LIKE" holds the same HANDOFF and QUALITY docs (keep both in sync).
- Build with `./build.sh`; it syntax-checks `london.html`. Identifiers are shared across all `src/london/*.js` files (one script scope): check for name clashes.
- Anything that moves or hides must be flagged `n.dyn=true` or the bake merges it. Hub geometry is emitted straight into chunks (`48b-hub-kit.js`).
- Verify with the bots: `python3 tools/london_play.py <out> near|estate|chase|climb`, `python3 tools/london_run.py run x0,z0 x1,z1`.
- Commit messages end with the session's attribution lines.
- **One script scope, duplicate `function` names do NOT error** (the later one silently wins). Check with: `cat src/engine/*.js src/london/*.js | grep -o '^\s*function [A-Za-z_$0-9]*' | sort | uniq -d`.
