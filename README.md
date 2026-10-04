# Emerald Lang for Visual Studio Code

Visual Studio Code support for [Emerald](https://emerald-lang.web.app), a friendly programming
language you'll enjoy writing.

## Requirements

The extension needs Emerald itself. [Install Emerald](https://emerald-lang.web.app/install/), then
open any `.em` file. If `emerald` isn't on your `PATH`, set `emerald.serverPath` to the
executable.

The extension provides:

- syntax highlighting for current Emerald declarations, keywords, literals, operators,
  annotations, members, and calls;
- interpolated, multiline, and raw strings;
- ordinary, documentation, nested block comments;
- starter snippets for declarations, types, constructors, properties, control flow,
  lambdas, collections, expressions, errors, resources, calls, and test functions;
- comment toggling, bracket matching, automatic closing, and basic indentation;
- live diagnostics, a document outline, format-on-save, hover, go to definition, find
  references, rename, completion, signature help, and quick fixes, from the Emerald compiler's
  own language server (`emerald lsp`);
- the `emerald` version in use, shown in the status bar.

The grammar follows the compiler's lexer and grows with the language. Completion offers a
value's fields, properties, and methods, including those of built-in types such as `String` and
`List`, the members of a type or namespace written before a dot, and the names in scope. Hover
shows a signature, a short description, and a link to the Emerald website. Signature help marks
the parameter you are writing, and quick fixes correct a few common mistakes with one click.
Completion of built-in members, hover descriptions, signature help, and quick fixes need
Emerald 0.7.0 or newer.

## The language server

This extension starts `emerald lsp` and talks to it over stdio; it does not implement any
language intelligence itself. That means the `emerald` executable has to be reachable:

- Build it from the sibling `emerald-lang` repository (`zig build` there produces
  `zig-out/bin/emerald`) and either put it on your `PATH`, or
- point the `emerald.serverPath` setting at it directly (a window reload is needed after
  changing this setting).

If the server can't be started, the extension shows an error naming the path it tried.
`emerald.trace.server` (`off`/`messages`/`verbose`) logs the JSON-RPC traffic between the
extension and the server, in the "Emerald Language Server" output channel, for debugging
either side.

## Try it locally

The extension needs VS Code 1.91 or newer.

```sh
npm install
npm test
npm run package
code --install-extension emerald-vscode-0.3.0.vsix
```

Open any `.em` file and select **Emerald Lang** if VS Code does not choose it automatically.
Use **Developer: Inspect Editor Tokens and Scopes** to inspect the scopes under the cursor.

## Development

Open this repository in VS Code and press **F5**. This builds the extension (via the
`watch` task) and opens the Extension Development Host with it loaded; open
`examples/sample.em` there to inspect the grammar, or any `.em` file to see live
diagnostics and the outline (with `emerald` on your `PATH`, or `emerald.serverPath` set,
in that development window).

`npm run compile` builds once (bundling `src/extension.ts` with esbuild, then type-checking
with `tsc --noEmit`); `npm run watch` rebuilds on save. `npm run package` always rebuilds
from a clean `dist/` first (`vscode:prepublish`), so a stray development artifact never
ends up in a packaged `.vsix`.

`npm test` runs the fast checks (grammar and manifest, `test/`) with no editor involved.
`npm run test:integration` goes further: it launches a real, downloaded VS Code build
with this extension loaded and a real `emerald lsp` running (via `emerald.serverPath`,
pointed at `../emerald-lang/zig-out/bin/emerald`), and exercises diagnostics, document
symbols, formatting, hover, go to definition, find references, rename, and completion
through it end to end (`src/test/extension.test.ts`). It launches Electron, which on some
Linux setups needs system libraries such as `libnspr4`/`libnss3`/`libasound2` or a virtual
display — see `docs/handoff.md` if it fails to launch a downloaded VS Code build.
