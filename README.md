# Emerald Lang for Visual Studio Code

Early Visual Studio Code support for the experimental Emerald programming language.

The extension provides:

- syntax highlighting for current Emerald declarations, keywords, literals, operators,
  annotations, members, and calls;
- interpolated, multiline, and raw strings;
- ordinary, documentation, nested block comments;
- starter snippets for declarations, types, constructors, properties, control flow,
  lambdas, collections, expressions, errors, resources, calls, and test functions;
- comment toggling, bracket matching, automatic closing, and basic indentation;
- live diagnostics, a document outline, and format-on-save, from the Emerald compiler's
  own language server (`emerald lsp`).

The grammar follows the compiler's current lexer and will evolve with the language. Hover,
go to definition, find references, rename, and completion aren't implemented by the
language server yet, so this extension doesn't offer them either — see the sibling
`emerald-lang` repository's `docs/handoff.md` for where that stands.

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

```sh
npm install
npm test
npm run package
code --install-extension emerald-vscode-0.2.0.vsix
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
