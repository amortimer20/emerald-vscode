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

const EXTENSION_ID = "emerald-lang.emerald-vscode";
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

    const edits = await waitFor("formatting edits", async () => {
      const result = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        "vscode.executeFormatDocumentProvider",
        document.uri
      );
      return result && result.length > 0 ? result : undefined;
    });

    assert.ok(edits.some((edit) => edit.newText.includes("const x = 1")));
  });
});
