// Integration suite for `npm run test:integration` (`@vscode/test-cli` +
// `@vscode/test-electron`): runs inside a real, downloaded VS Code build with
// this extension loaded, unlike `npm test`'s grammar/manifest checks, which
// never start an editor. This is the one piece of end-to-end verification
// noted as missing in `docs/handoff.md` — that a live `emerald lsp` process,
// started by this extension's own client wiring, actually answers real
// requests from a real editor instance.
//
// `emerald.serverPath` is pointed at the sibling `emerald-lang` repository's
// build output before the extension is activated (as opposed to after, which
// would need a window reload — see the setting's own description) so a
// single activation talks to the right binary throughout.

import * as assert from "node:assert";
import * as path from "node:path";
import * as vscode from "vscode";

const EXTENSION_ID = "amortimer20.emerald-vscode";
const SERVER_PATH = path.resolve(__dirname, "../../../emerald-lang/zig-out/bin/emerald");

async function activateExtension(): Promise<void> {
  const configuration = vscode.workspace.getConfiguration("emerald");
  await configuration.update("serverPath", SERVER_PATH, vscode.ConfigurationTarget.Global);

  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, `extension '${EXTENSION_ID}' was not found among the installed extensions`);
  await extension.activate();
}

async function waitFor<T>(
  description: string,
  check: () => T | undefined | Promise<T | undefined>,
  timeoutMs = 15000
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value !== undefined) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`timed out waiting for: ${description}`);
}

suite("Emerald language client", () => {
  suiteSetup(async () => {
    await activateExtension();
  });

  test("publishes a diagnostic for an invalid document", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: 'const x: Int = "oops"\n'
    });
    await vscode.window.showTextDocument(document);

    const diagnostics = await waitFor("a diagnostic on the invalid document", () => {
      const found = vscode.languages.getDiagnostics(document.uri);
      return found.length > 0 ? found : undefined;
    });

    assert.strictEqual(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /Int/);
    assert.strictEqual(diagnostics[0].range.start.line, 0);
  });

  test("clears diagnostics once the document is fixed", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: 'const x: Int = "oops"\n'
    });
    const editor = await vscode.window.showTextDocument(document);

    await waitFor("the initial diagnostic", () => {
      const found = vscode.languages.getDiagnostics(document.uri);
      return found.length > 0 ? found : undefined;
    });

    await editor.edit((builder) => {
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      builder.replace(fullRange, "const x: Int = 1\n");
    });

    await waitFor("diagnostics to clear", () => {
      const found = vscode.languages.getDiagnostics(document.uri);
      return found.length === 0 ? found : undefined;
    });
  });

  test("returns a document symbol for a top-level declaration", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "struct Point {\n    const x: Int\n    const y: Int\n}\n"
    });
    await vscode.window.showTextDocument(document);

    const symbols = await waitFor("document symbols", async () => {
      const result = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        "vscode.executeDocumentSymbolProvider",
        document.uri
      );
      return result && result.length > 0 ? result : undefined;
    });

    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, "Point");
    assert.strictEqual(symbols[0].kind, vscode.SymbolKind.Struct);
  });

  test("formats a document via the format-on-save provider", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "const   x   =   1\n"
    });
    await vscode.window.showTextDocument(document);

    // `vscode.executeFormatDocumentProvider` returns VS Code's own minimized
    // diff against the current text (several small edits removing individual
    // whitespace runs), not the server's one whole-document edit verbatim, so
    // no single edit's `newText` holds the fully reformatted line — the
    // actual post-format document text is what "format on save" promises,
    // and the only thing worth asserting on.
    await waitFor("the document to be reformatted", async () => {
      await vscode.commands.executeCommand("editor.action.formatDocument");
      return document.getText() === "const x = 1\n" ? true : undefined;
    });
  });

  // The server's second LSP phase (hover, go to definition, find references,
  // rename, completion) needed no client-side code at all —
  // `vscode-languageclient` negotiates each capability automatically from
  // what `emerald lsp` advertises during `initialize` — but that was a claim
  // until it was actually exercised against a live server through a real
  // editor command, which is what these five do.

  test("shows an inferred type on hover", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "struct Point {\n    var x: Int\n}\nconst p = Point(1)\nprint(p.x)\n"
    });
    await vscode.window.showTextDocument(document);

    const hovers = await waitFor("hover contents", async () => {
      const result = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        document.uri,
        new vscode.Position(4, 8)
      );
      return result && result.length > 0 ? result : undefined;
    });

    const contents = hovers[0].contents
      .map((part) => (typeof part === "string" ? part : part.value))
      .join("\n");
    assert.match(contents, /Int/);
  });

  test("jumps to a field's declaration from a member access", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "struct Point {\n    var x: Int\n}\nconst p = Point(1)\nprint(p.x)\n"
    });
    await vscode.window.showTextDocument(document);

    const locations = await waitFor("a definition location", async () => {
      const result = await vscode.commands.executeCommand<(vscode.Location | vscode.LocationLink)[]>(
        "vscode.executeDefinitionProvider",
        document.uri,
        new vscode.Position(4, 8)
      );
      return result && result.length > 0 ? result : undefined;
    });

    const range = "range" in locations[0] ? locations[0].range : locations[0].targetRange;
    assert.strictEqual(range.start.line, 1);
    assert.strictEqual(range.start.character, 8);
  });

  test("finds every read of a variable", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "var total = 5\nprint(total)\nprint(total + 1)\n"
    });
    await vscode.window.showTextDocument(document);

    const locations = await waitFor("reference locations", async () => {
      const result = await vscode.commands.executeCommand<vscode.Location[]>(
        "vscode.executeReferenceProvider",
        document.uri,
        new vscode.Position(0, 4)
      );
      return result && result.length > 0 ? result : undefined;
    });

    const lines = locations.map((location) => location.range.start.line).sort();
    assert.ok(lines.includes(1), `expected a reference on line 1, got ${JSON.stringify(lines)}`);
    assert.ok(lines.includes(2), `expected a reference on line 2, got ${JSON.stringify(lines)}`);
  });

  test("renames a field at both its declaration and its use", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "struct Point {\n    var x: Int\n}\nconst p = Point(1)\nprint(p.x)\n"
    });
    await vscode.window.showTextDocument(document);

    const edit = await waitFor("a rename edit", async () => {
      const result = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
        "vscode.executeDocumentRenameProvider",
        document.uri,
        new vscode.Position(4, 8),
        "value"
      );
      const entries = result?.get(document.uri);
      return entries && entries.length > 0 ? entries : undefined;
    });

    const lines = edit.map((textEdit) => textEdit.range.start.line).sort();
    assert.deepStrictEqual(lines, [1, 4]);
    assert.ok(edit.every((textEdit) => textEdit.newText === "value"));
  });

  test("completes a struct's own fields after a dot, even mid-call with an unclosed paren", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "emerald",
      content: "struct Point {\n    var x: Int\n    var y: Int\n}\nconst p = Point(1, 2)\nprint(p."
    });
    await vscode.window.showTextDocument(document);

    const list = await waitFor("completion items", async () => {
      const result = await vscode.commands.executeCommand<vscode.CompletionList>(
        "vscode.executeCompletionItemProvider",
        document.uri,
        new vscode.Position(5, 8)
      );
      return result && result.items.length > 0 ? result : undefined;
    });

    const labels = list.items.map((item) =>
      typeof item.label === "string" ? item.label : item.label.label
    );
    assert.ok(labels.includes("x"), `expected "x" among ${JSON.stringify(labels)}`);
    assert.ok(labels.includes("y"), `expected "y" among ${JSON.stringify(labels)}`);
  });
});
