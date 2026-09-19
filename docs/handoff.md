# Emerald VS Code extension handoff

## Current milestone

Updated: 2026-09-18. The extension recognizes Emerald's named built-in collection types:
`List[T]`, `Dict[K, V]`, and `Set[T]`. They receive built-in type scopes in the TextMate
grammar, appear in the representative sample, and have focused grammar coverage and type
snippets. The compiler repository remains the source of truth; retired collection type
spellings receive no special editor support.

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
- Manual verification so far: `npm run compile`'s `tsc --noEmit` step type-checks
  `src/extension.ts` against the real `vscode-languageclient`/`@types/vscode` APIs;
  packaging was checked file-by-file (above); the compiler side of the protocol was
  already exercised thoroughly and separately, by hand-framing JSON-RPC messages
  straight at `emerald lsp` (see `../emerald-lang/docs/handoff.md`'s "LSP decisions
  worth knowing").
- `npm run test:integration` (`@vscode/test-cli` + `@vscode/test-electron`,
  `src/test/extension.test.ts`) drives a real, downloaded VS Code build with this
  extension loaded via `--extensionDevelopmentPath`: it points `emerald.serverPath` at
  the sibling `emerald-lang` repo's `zig-out/bin/emerald` before activating, then opens
  in-memory (`untitled`) `.em` documents and asserts on `vscode.languages.getDiagnostics`,
  `vscode.executeDocumentSymbolProvider`, and `vscode.executeFormatDocumentProvider` —
  i.e. that a real editor round-trip through a real `emerald lsp` process actually works,
  not just that the client compiles against the right types. `npm run pretest:integration`
  compiles it (plain `tsc`, to `out/`, separately from `dist/extension.js`'s esbuild
  bundle, since Mocha loads these files directly inside the Extension Development Host
  rather than through the bundled entry point). `npm test`'s `node --test` is scoped to
  `test/` specifically so it never picks up these files (they `require("vscode")`, which
  only resolves inside that host).
  - **Written but not yet actually run to a pass in this development sandbox**:
    `vscode-test` downloads a real VS Code build fine (confirms network access works),
    but the downloaded Electron binary fails to start here — `libnspr4.so`,
    `libnss3.so`, `libnssutil3.so`, `libsmime3.so`, and `libasound.so.2` are missing
    system libraries (`ldd` on the binary confirms exactly these five), and this sandbox
    has no passwordless `sudo`, so installing them isn't something to do silently. On a
    machine that can install them (Ubuntu 26.04 here; package names may differ
    elsewhere): `sudo apt-get install -y libnspr4 libnss3 libasound2t64`, then `npm run
    test:integration`.
  - **The round trip this suite exercises has, however, now been verified directly, in
    a real user's VS Code window (Remote - WSL) with a real `emerald lsp` process** —
    and it found a real bug this suite would also have caught: `vscode-languageclient`
    invokes the server as `emerald lsp --stdio`, not the bare `emerald lsp` every manual
    JSON-RPC test before this had used, and the server rejected the extra argument as
    misuse (see `../emerald-lang/docs/handoff.md`'s "LSP decisions worth knowing" for
    the fix and the full symptom chain — a startup exit code buried in the Output
    channel above a cryptic `Pending response rejected since connection got disposed`).
    After that fix, diagnostics, `documentSymbol`, and `didChange` were all confirmed
    working end to end against a real editor. So: proven correct in practice, just not
    yet by this particular automated suite in this particular sandbox.

## Known limitations and next work

- **The `@vscode/test-electron` suite needs to actually be run once, for its own sake.**
  It exists (`src/test/extension.test.ts`, `.vscode-test.mjs`) and compiles, and the
  round trip it covers has separately been confirmed working against a real editor (see
  the Validation section above) — but the suite itself has not passed in this sandbox,
  see the missing-system-libraries note there. Worth running for real once, so it is a
  standing regression check rather than a one-time manual confirmation.
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
