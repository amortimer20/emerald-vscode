# Emerald Lang for Visual Studio Code

Early Visual Studio Code support for the experimental Emerald programming language.

The first release provides:

- syntax highlighting for current Emerald declarations, keywords, literals, operators,
  annotations, members, and calls;
- interpolated, multiline, and raw strings;
- ordinary, documentation, nested block comments;
- comment toggling, bracket matching, automatic closing, and basic indentation.

The grammar follows the compiler's current lexer and will evolve with the language. Rich
completion, diagnostics, navigation, formatting, and semantic highlighting belong to a
future Emerald language server.

## Try it locally

```sh
npm install
npm test
npm run package
code --install-extension emerald-lang-0.1.0.vsix
```

Open any `.em` file and select **Emerald Lang** if VS Code does not choose it automatically.
Use **Developer: Inspect Editor Tokens and Scopes** to inspect the scopes under the cursor.

## Development

Open this repository in VS Code and press **F5**. The Extension Development Host opens
with the extension loaded; open `examples/sample.em` there to inspect the grammar.

This repository intentionally starts with declarative editor support only. It has no
extension-host JavaScript and does not run any background process.
