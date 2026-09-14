// Starts `emerald lsp` (the Emerald compiler's own language server, see
// `../emerald-lang/docs/rewrite-context.md` section 18.5) and connects it to
// `.em` files over stdio. This first slice's server only advertises live
// diagnostics, document symbols, and format-on-save — hover, go to
// definition, find references, rename, and completion are not implemented on
// the server yet, so this client does nothing special for them; VS Code
// simply will not offer that UI, since the server never claims to support it.
//
// `vscode-languageclient` reads the `emerald.serverPath` and
// `emerald.trace.server` settings on its own by convention, from the `id`
// ("emerald") passed to `LanguageClient` below — see `package.json`'s
// `contributes.configuration`.

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export async function activate(_context: vscode.ExtensionContext): Promise<void> {
  const configuration = vscode.workspace.getConfiguration("emerald");
  const command = configuration.get<string>("serverPath", "emerald");

  const serverOptions: ServerOptions = {
    command,
    args: ["lsp"],
    transport: TransportKind.stdio
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "emerald" },
      { scheme: "untitled", language: "emerald" }
    ]
  };

  client = new LanguageClient("emerald", "Emerald Language Server", serverOptions, clientOptions);

  try {
    await client.start();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Emerald language server failed to start (looked for '${command}' on the PATH). ` +
        "Build it from the emerald-lang repository, make sure it is on the PATH, or set " +
        `the 'emerald.serverPath' setting. (${String(error)})`
    );
  }
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
