# Emerald VS Code extension handoff

## Current milestone

Updated: 2026-10-27. Version 0.3.0 is published on the Marketplace as
`amortimer20.emerald-vscode` (2026-10-04; 0.2.2 was published 2026-10-01). The published package
is byte-identical to a build of `638d8cd`. Emerald 0.7.0, whose language server provides the
completion, hover, signature help, and quick fixes the 0.3.0 README and changelog describe, was
released on 2026-10-11 (0.6.0's server has completion and hover but no signature help or code
actions; the README says so).

The `v0.3.0` tag is an annotated tag on `638d8cd`, pushed 2026-10-27. Earlier notes recorded a
local lightweight tag, but it had been lost, so it was recreated.

0.3.0 added the version display (activation runs the configured `emerald.serverPath`, or
`emerald` on `PATH`, with `--version`; the output channel's first line is
`Using <full path>: <version output>` and a right-aligned status item shows the version and opens
the channel; a failed probe creates no item and leaves the startup error alone) and a separate
`support.class.builtin.emerald` grammar scope for the standard library's classes and namespaces,
which the website's two themes colour. Its notes are in `CHANGELOG.md`.

**Coming from the compiler:** user generics are being built on emerald-lang's `claude/generics`
branch (`class Grid[T]`, `func largest[T with Ordered](...)`, `enum Chain[Item]`). When they ship,
check that the grammar highlights a type parameter list after a declaration's name and `with`
inside it, and add them to the representative sample and grammar tests. Nothing here changes
until that branch is merged.

## Implemented

- Language registration, `.em` association, TextMate grammar and scopes,
  comment/bracket/indentation configuration, starter snippets, extension artwork.
- `src/extension.ts` starts `emerald lsp` (stdio transport) via `vscode-languageclient` and
  connects it to `file`/`untitled` `.em` documents. Bundled with esbuild into
  `dist/extension.js` (the manifest's `main`), so the packaged extension needs nothing
  from `node_modules` at runtime; `npm run package` uses `vsce package --no-dependencies`.
- Every language feature (diagnostics, symbols, format-on-save, hover, go to definition, find
  references, rename, completion, signature help, quick fixes) comes from the server.
  `vscode-languageclient` negotiates each from what the server advertises during `initialize`, so
  none needs client code here.
- Two settings: `emerald.serverPath` (defaults to `emerald` on `PATH`) and
  `emerald.trace.server` (`off`/`messages`/`verbose`, read automatically by
  `vscode-languageclient` from the `emerald` client id passed to `LanguageClient`).
- A friendly error message (naming the path that was tried) if the server fails to start,
  on top of `vscode-languageclient`'s own error and restart handling.
- The version line in the output channel and the clickable status item, neither shown if the
  version probe fails.
- Built-in class and namespace names use a separate whole-word grammar scope, covered by
  the representative sample and focused TextMate tests.
- `.vscode/tasks.json`'s `npm: watch` task is `F5`'s `preLaunchTask`, so the Extension
  Development Host always launches against a freshly built `dist/extension.js`.

## Source of truth

The sibling `../emerald-lang` repository defines the language and the server. Its lexer
and token files are the immediate authority for lexical syntax; `docs/rewrite-context.md`
records settled and deferred design decisions, and section 18.5 is the server's own contract.
The history of the server's protocol choices, including why the server accepts
`emerald lsp --stdio` (the spelling `vscode-languageclient` uses), is under "LSP decisions worth
knowing" in its `docs/journal.md`. This extension should never advertise or special-case a
capability the server doesn't implement.

## Validation

Last run for 0.3.0 (2026-10-04); nothing has changed since, so none was rerun on 2026-10-27.

- `npm test` (runs `npm run compile` first via `pretest`: esbuild bundle, then
  `tsc --noEmit`): 12 tests, 8 grammar and 4 manifest.
- `npm run package` produces the VSIX with the bundled `dist/extension.js` and no source map or
  `node_modules/`.
- `npm run test:integration` (`@vscode/test-cli` and `@vscode/test-electron`,
  `src/test/extension.test.ts`) drives a downloaded VS Code build with this extension loaded,
  pointing `emerald.serverPath` at the sibling repository's `zig-out/bin/emerald`: 10 tests,
  covering diagnostics appearing and clearing, document symbols, the version status item, a real
  "Format Document", hover, definition, references, rename, and completion mid-call. Its files are
  compiled with plain `tsc` to `out/`, separately from the bundle, and `npm test`'s `node --test`
  is scoped to `test/` so it never loads them (they `require("vscode")`, which resolves only inside
  the Extension Development Host). The Electron build needs `libnspr4`, `libnss3`,
  `libnssutil3`, `libsmime3`, and `libasound2` on Linux.

## Known limitations and next work

- **`emerald.serverPath` changes need a manual window reload.** No configuration-change
  listener restarts the client yet; the setting's description and the README say so.
- The extension is `amortimer20.emerald-vscode`. The `emerald-lang` publisher belongs to someone
  else, who publishes the unrelated `emerald-lang.emerald-lang` ("Emerald Language", for `.emld`
  files), so the user publishes under their own account.
- More snippets can be added in small independent slices once the syntax they expose has
  settled; generics are the next candidate.
