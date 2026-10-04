# Emerald VS Code extension handoff

## Current milestone

Updated: 2026-10-04. Version 0.3.0 is prepared and not yet published; the user publishes and
tags it (`npx vsce publish`, then `v0.3.0`), after Emerald 0.7.0 is released, because the
completion, hover, signature help, and quick-fix behavior it describes comes from that
compiler release (0.6.0's server has completion and hover but no signature help or code
actions). The release adds the version display (activation runs the configured `emerald.serverPath`,
or `emerald` on `PATH`, with `--version`; the output channel's first line is
`Using <full path>: <version output>` and a right-aligned status item shows the version and opens
the channel; a failed probe creates no item and leaves the startup error alone) and a separate
`support.class.builtin.emerald` grammar scope for the standard library's classes and
namespaces, with the existing `support.type.builtin.emerald` rule unchanged. The website's two
themes colour it. 0.2.2 was built but never published, so 0.3.0 is the first Marketplace
release; its notes are in `CHANGELOG.md`.

Updated: 2026-09-21. The compiler's `emerald lsp` completed its whole second LSP phase
(hover, go to definition, find references, rename, and completion — see
`../emerald-lang/docs/handoff.md`), and none of it needed a single line of client code
here: `vscode-languageclient` negotiates every one of these automatically from what the
server advertises during `initialize`, exactly as this file anticipated when that phase
was still pending. Confirmed rather than assumed — see "Validation" below, which now
covers all five through real editor commands (`vscode.executeHoverProvider` and the rest)
against a real `emerald lsp` process, not just a compiles-against-the-types check.

Along the way, the `@vscode/test-electron` integration suite ran to a real pass in this
sandbox for the first time: the system libraries it was previously missing
(`libnspr4`/`libnss3`/`libnssutil3`/`libsmime3`/`libasound2`) are now present. Running it
surfaced one pre-existing bug in the suite itself (not the extension or the server): the
format-on-save test asserted on `vscode.executeFormatDocumentProvider`'s raw edits, but
VS Code returns its own minimized diff against the current text (several small
whitespace-only edits) rather than the server's one whole-document edit verbatim, so no
single edit's `newText` ever held the fully reformatted line. Fixed by asserting on the
document's actual text after applying a real "Format Document" command instead — what
"format on save" actually promises.

## Previous milestone

Updated: 2026-09-18. The extension recognizes Emerald's named built-in collection types:
`List[T]`, `Dict[K, V]`, and `Set[T]`. They receive built-in type scopes in the TextMate
grammar, appear in the representative sample, and have focused grammar coverage and type
snippets. The compiler repository remains the source of truth; retired collection type
spellings receive no special editor support.

Version 0.2.1 adds named collection-type support on top of the 0.2.0 language-client release: it starts
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
- Activation records the configured server's version as the first line of the language
  client's output channel and exposes that version in a right-aligned, clickable status
  item; neither is shown if the version probe fails.
- Built-in class and namespace names use a separate whole-word grammar scope, covered by
  the representative sample and focused TextMate tests.
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

- `npm ci` completed. npm reported 10 dependency advisories (2 low, 1 moderate, 7 high);
  no dependency or lockfile changes were made for this slice.
- `npm test` (runs `npm run compile` first via `pretest`: esbuild bundle, then
  `tsc --noEmit`) — all 12 tests pass (8 grammar, 4 manifest).
- `npm run package -- --out /tmp/emerald-vscode-slice-6.vsix` produced an 11-file,
  112.96 KB VSIX without overwriting the pre-existing ignored package artifact. The
  package contains the bundled `dist/extension.js`, but no source map or `node_modules/`.
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
  in-memory (`untitled`) `.em` documents and asserts against a real editor, not just that
  the client compiles against the right types. `npm run pretest:integration` compiles it
  (plain `tsc`, to `out/`, separately from `dist/extension.js`'s esbuild bundle, since
  Mocha loads these files directly inside the Extension Development Host rather than
  through the bundled entry point). `npm test`'s `node --test` is scoped to `test/`
  specifically so it never picks up these files (they `require("vscode")`, which only
  resolves inside that host).
  - **Now actually passing in this sandbox** (previously blocked — see below): 10 tests,
    covering `vscode.languages.getDiagnostics` (a diagnostic appearing and clearing),
    `executeDocumentSymbolProvider`, the Emerald version status item, a real "Format
    Document" command's effect on the document's text, and — the second LSP phase's own coverage —
    `executeHoverProvider` (an inferred type), `executeDefinitionProvider` (a field
    access jumping to its declaration), `executeReferenceProvider` (every read of a
    variable), `executeDocumentRenameProvider` (a field renamed at both its declaration
    and its use), and `executeCompletionItemProvider` (a struct's own fields offered
    after a dot, deliberately mid-call with an unclosed paren — completion's own hardest
    case; see `../emerald-lang/docs/handoff.md`'s completion section for why that
    specific shape matters).
  - **Previously blocked on missing system libraries, now resolved**: the downloaded
    Electron binary used to fail to start here because `libnspr4.so`, `libnss3.so`,
    `libnssutil3.so`, `libsmime3.so`, and `libasound.so.2` were missing; all five are
    now present in this sandbox (confirmed via `ldconfig -p` before rerunning), and the
    suite runs to completion without needing `sudo apt-get install` after all.
  - **The round trip this suite exercises was also verified directly, in a real user's
    VS Code window (Remote - WSL) with a real `emerald lsp` process**, before this
    suite could run here — and it found a real bug this suite would also have caught:
    `vscode-languageclient` invokes the server as `emerald lsp --stdio`, not the bare
    `emerald lsp` every manual JSON-RPC test before this had used, and the server
    rejected the extra argument as misuse (see `../emerald-lang/docs/handoff.md`'s "LSP
    decisions worth knowing" for the fix and the full symptom chain — a startup exit
    code buried in the Output channel above a cryptic `Pending response rejected since
    connection got disposed`).

## Known limitations and next work

- **`emerald.serverPath` changes need a manual window reload.** No configuration-change
  listener restarts the client automatically yet; this is documented in the setting's own
  description and in the README rather than silently surprising anyone.
- Completion answers only a value's own member access; a type-qualified base's own
  completions (10.4), namespace-level completion, and a bare identifier with no preceding
  dot are not implemented by the server yet (`../emerald-lang/docs/handoff.md`'s rough
  edges) and so are not available here either — same "nothing to do here beyond what
  `vscode-languageclient` already negotiates" situation as the rest of the second phase.
- The extension is `amortimer20.emerald-vscode` (2026-10-01). The `emerald-lang` publisher
  belongs to someone else, who publishes the unrelated `emerald-lang.emerald-lang` ("Emerald
  Language", for `.emld` files), so the user publishes under their own account, `amortimer20`.
- More snippets can be added in small independent slices after the language syntax they
  expose has stabilized.
