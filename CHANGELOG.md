# Changelog

## 0.3.0

Completion, hover, signature help, and quick fixes come from the `emerald` executable, and the
richer behavior below needs Emerald 0.7.0 or newer. Highlighting and the version display work with
any version.

- Completion offers the members of built-in types and namespaces, such as `String`, `List`,
  `File`, and `Math`, each with its signature and a one-line description. Choosing a method writes
  its parentheses, and leaves the cursor between them when it takes arguments.
- Hover shows a member's signature, a plain-language summary, whether it can raise an error, and a
  link to its page on the Emerald website. Your own declarations show their `##` comments.
- Signature help appears as you write a call, after `(` and after each `,`, with the current
  parameter marked. It covers functions, methods, constructors, default values, named arguments,
  and overloads.
- Quick fixes offer one-click corrections for a few mistakes: another language's name for a
  method (`push` becomes `append`, `has_key` becomes `contains_key?`), `this` for `self`, and a
  misspelled annotation (`@overide` becomes `@override`).
- The status bar shows which `emerald` the extension started and its version. Clicking it opens
  the "Emerald Language Server" output channel, whose first line names the executable's full path.
- Highlight the built-in classes and namespaces (`File`, `Math`, `Json`, `RuntimeError`, and the
  rest) like the built-in types.
- Make the format-on-save integration test independent of which editor has focus.

## 0.2.2

- Add integration coverage for hover, go to definition, find references, rename, and completion;
  fix the format-on-save test to verify the resulting document text.
- Highlight `random` and `exit` as built-in functions and `Bytes` and `Range` as built-in types.
- Update `brace-expansion`, `fast-uri`, and `serialize-javascript` to patched versions.

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
