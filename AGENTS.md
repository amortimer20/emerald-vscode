# Shared agent working instructions

These instructions apply to agents working on the Emerald VS Code extension. The user's
current instructions take precedence.

## Start of a session

1. Read `docs/handoff.md`.
2. Inspect `git status --short --branch`, the recent log, and relevant working-tree diffs.
3. Treat the sibling `../emerald-lang` compiler repository as the source of truth for
   Emerald syntax. Before changing the grammar, inspect its `src/Token.zig`,
   `src/Lexer.zig`, and relevant parts of `docs/rewrite-context.md`.

## Scope and validation

- Keep TextMate highlighting lexical. Do not guess at semantic distinctions that require
  type checking or name resolution.
- Prefer standard TextMate scopes so installed VS Code themes work without Emerald-specific
  color rules.
- Update the grammar, representative sample, and focused tests together when syntax changes.
- Run `npm ci`, `npm test`, `npm run package`, and `git diff --check` for grammar changes.
- Do not commit `node_modules`, generated `.vsix` files, logs, or machine-specific paths.
- Update `docs/handoff.md` before handing completed work back. Replace stale status rather
  than appending a session diary.

## Git

- Preserve unrelated changes and inspect files before staging.
- Commit or push only when the user has authorized it. Do not amend or rewrite history
  without explicit authorization.
