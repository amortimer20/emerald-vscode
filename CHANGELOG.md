# Changelog

## 0.2.1

- Highlight `List`, `Dict`, and `Set` as built-in types, and add `type-list`, `type-dict`, and
  `type-set` snippets for writing them.
- Add an integration test suite that runs the extension in a real VS Code with
  `@vscode/test-electron`.

## 0.2.0

- Add a language client that starts `emerald lsp` and connects it to `.em` files, bringing
  live diagnostics, document symbols, and format-on-save into the editor.
- Add the `emerald.serverPath` setting (the `emerald` executable to run) and
  `emerald.trace.server` (JSON-RPC tracing in the "Emerald Language Server" output
  channel).

## 0.1.0

- Add Emerald language registration and `.em` file association.
- Add TextMate syntax highlighting.
- Add comments, brackets, automatic closing, and indentation configuration.
