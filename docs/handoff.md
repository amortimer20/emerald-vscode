# Emerald VS Code extension handoff

## Current milestone

Version 0.1.0 provides a declarative VS Code language extension for `.em` files. It can be
developed and packaged independently while the Emerald compiler evolves.

## Implemented

- Registers the Emerald language and `.em` file extension.
- Includes the Emerald gem's source SVG and rendered PNG for the extension artwork.
- Highlights declarations, names, current keywords, built-in types, literals, operators,
  annotations, function calls, and members with standard TextMate scopes.
- Handles documentation and line comments, recursively nested block comments, raw strings,
  multiline strings, escapes, and interpolated Emerald expressions.
- Configures comment toggling, bracket matching, automatic closing, surrounding pairs, and
  brace-based indentation.
- Includes starter snippets for declarations, types, control flow, lambdas, and test functions.
- Includes a representative Emerald file and tests that load the grammar through VS Code's
  TextMate and Oniguruma libraries.

## Source of truth

The sibling `../emerald-lang` repository defines the language. Its lexer and token files are
the immediate authority for lexical syntax; `docs/rewrite-context.md` records settled and
deferred design decisions. Update this extension as compiler syntax lands.

## Validation

- `npm test`
- `npm run package`

All nine tests pass with Node 26.8.1 and npm 11.19.0. Packaging produces
`emerald-vscode-0.1.0.vsix` and includes both extension artwork files.

## Known limitations and next work

- TextMate grammars do not know resolved types or symbols. Semantic highlighting,
  completion, diagnostics, navigation, and renaming require a later language server.
- The package name is `emerald-vscode`, avoiding a collision with the unrelated published
  extension `emerald-lang.emerald-lang`. The `publisher` manifest value must still be
  matched to the actual Visual Studio Marketplace publisher before publication.
- Repository and issue URLs should be added after the remote repository exists.
- More snippets can be added in small independent slices after the language syntax they
  expose has stabilized.
