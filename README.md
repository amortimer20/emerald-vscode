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
code --install-extension emerald-vscode-0.1.0.vsix
```

Open any `.em` file and select **Emerald Lang** if VS Code does not choose it automatically.
Use **Developer: Inspect Editor Tokens and Scopes** to inspect the scopes under the cursor.

## Use the Emerald file icon with vscode-icons

The extension includes `icons/file_type_emerald.svg` for the
[vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)
icon theme. vscode-icons loads custom artwork from VS Code's user directory, so copy the
file there:

```text
Windows: %APPDATA%\Code\User\vsicons-custom-icons\
Linux:   ~/.config/Code/User/vsicons-custom-icons/
macOS:   ~/Library/Application Support/Code/User/vsicons-custom-icons/
```

Then add this custom association to your user `settings.json`:

```json
"vsicons.associations.files": [
  { "icon": "emerald", "extensions": ["em"], "format": "svg" }
]
```

Run **vscode-icons: Apply Icons Customization** from the Command Palette and reload the
window. The icon must retain the name `file_type_emerald.svg`; vscode-icons adds the
`file_type_` prefix to the association's `emerald` icon name.

## Development

Open this repository in VS Code and press **F5**. The Extension Development Host opens
with the extension loaded; open `examples/sample.em` there to inspect the grammar.

This repository intentionally starts with declarative editor support only. It has no
extension-host JavaScript and does not run any background process.
