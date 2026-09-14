# Emerald VS Code extension handoff

## Current milestone

Version 0.2.0 adds a language client on top of the 0.1.0 declarative extension: it starts
the Emerald compiler's own `emerald lsp` and connects it to `.em` files, bringing live
diagnostics, a document outline, and format-on-save into the editor. It can still be
developed and packaged independently while the compiler evolves — the client is generic
LSP wiring, not aware of Emerald's semantics itself.

## Implemented

- Everything from 0.1.0: language registration, `.em` association, TextMate grammar and
  scopes, comment/bracket/indentation configuration, starter snippets, extension artwork.
- `src/extension.ts` starts `emerald lsp` (stdio transport) via `vscode-languageclient` and
  connects it to `file`/`untitled` `.em` documents. Bundled with esbuild into
  `dist/extension.js` (the manifest's `main`), so the packaged extension needs nothing
  from `node_modules` at runtime — `npm run package` keeps using
  `vsce package --no-dependencies`.
- Two settings: `emerald.serverPath` (defaults to `emerald` on `PATH`) and
  `emerald.trace.server` (`off`/`messages`/`verbose`, read automatically by
  `vscode-languageclient` from the `emerald` client id passed to `LanguageClient`).
- A friendly error message (naming the path that was tried) if the server fails to start,
  on top of `vscode-languageclient`'s own built-in error/restart handling.
- `.vscode/tasks.json`'s `npm: watch` task is `F5`'s `preLaunchTask`, so the Extension
  Development Host always launches against a freshly built `dist/extension.js`.

## Source of truth

The sibling `../emerald-lang` repository defines the language and the server. Its lexer
and token files are the immediate authority for lexical syntax; `docs/rewrite-context.md`
records settled and deferred design decisions, and section 18.5 is the LSP's own contract.
`docs/handoff.md` there records exactly what the server supports today ("LSP decisions
worth knowing") — this extension should never advertise or special-case a capability the
server doesn't actually implement.

## Validation

- `npm test` (runs `npm run compile` first via `pretest`: esbuild bundle, then
  `tsc --noEmit`) — all ten tests pass (six grammar, four manifest), Node 26.8.1 / npm
  11.19.0.
- `npm run package` produces `emerald-vscode-0.2.0.vsix`; confirmed the packaged
  `dist/extension.js` has no leftover development source map (a stale one from an earlier
  plain `npm run compile` used to survive into a `--production` package, since esbuild
  only writes what the *current* build produces — `esbuild.js` now removes `dist/` before
  every build to rule that out) and that `node_modules` is not included (bundling makes
  `vscode-languageclient` part of `dist/extension.js` itself).
- Not yet done: an automated end-to-end check that a real VS Code instance activates the
  extension, connects to a running `emerald lsp`, and receives diagnostics — that needs
  `@vscode/test-electron` (downloads a real VS Code build to drive), which is a
  reasonable-sized addition of its own rather than something to fold in silently here.
  Manual verification so far: `npm run compile`'s `tsc --noEmit` step type-checks
  `src/extension.ts` against the real `vscode-languageclient`/`@types/vscode` APIs;
  packaging was checked file-by-file (above); the compiler side of the protocol was
  already exercised thoroughly and separately, by hand-framing JSON-RPC messages
  straight at `emerald lsp` (see `../emerald-lang/docs/handoff.md`'s "LSP decisions
  worth knowing").

## Known limitations and next work

- **`@vscode/test-electron` integration test** — the one piece of real verification this
  slice does not have: launch a real VS Code instance, open a `.em` file, and assert
  diagnostics/outline/formatting actually arrive from a live `emerald lsp` process. Worth
  doing before this is considered fully proven, not just plausibly wired correctly.
- **`emerald.serverPath` changes need a manual window reload.** No configuration-change
  listener restarts the client automatically yet; this is documented in the setting's own
  description and in the README rather than silently surprising anyone.
- Hover, go to definition, find references, rename, and completion have no client-side
  code because the server doesn't implement them yet (`../emerald-lang`'s own next LSP
  slice). Nothing here needs to change when they land beyond what `vscode-languageclient`
  already negotiates automatically from the server's advertised capabilities — small,
  additive registrations, not a rework of this file.
- The package name is `emerald-vscode`, avoiding a collision with the unrelated published
  extension `emerald-lang.emerald-lang`. The `publisher` manifest value must still be
  matched to the actual Visual Studio Marketplace publisher before publication.
- Repository and issue URLs should be added after the remote repository exists.
- More snippets can be added in small independent slices after the language syntax they
  expose has stabilized.
