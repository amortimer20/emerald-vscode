// Starts `emerald lsp` (the Emerald compiler's own language server, see
// `../emerald-lang/docs/rewrite-context.md` section 18.5) and connects it to
// `.em` files over stdio. The server now advertises live diagnostics,
// document symbols, format-on-save, hover, go to definition, find
// references, rename, and completion (its first two LSP phases) —
// `vscode-languageclient` negotiates each of these automatically from what
// the server claims during `initialize`, so this client has no
// capability-specific code of its own for any of them.
//
// `vscode-languageclient` reads the `emerald.serverPath` and
// `emerald.trace.server` settings on its own by convention, from the `id`
// ("emerald") passed to `LanguageClient` below — see `package.json`'s
// `contributes.configuration`.

import * as vscode from "vscode";
import * as fs from "node:fs";
import { execFile } from "node:child_process";
import * as path from "node:path";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

interface ServerVersion {
  executablePath: string;
  output: string;
}

export interface EmeraldExtensionApi {
  versionStatusBarItem?: vscode.StatusBarItem;
}

function resolveExecutablePath(command: string): string | undefined {
  const hasPath = path.isAbsolute(command) || command.includes("/") || command.includes("\\");
  const executableNames =
    process.platform === "win32" && !path.extname(command)
      ? [command, ...(process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").map((extension) => `${command}${extension}`)]
      : [command];
  const directories = hasPath ? [""] : (process.env.PATH ?? "").split(path.delimiter);

  for (const directory of directories) {
    for (const executableName of executableNames) {
      const candidate = hasPath
        ? path.resolve(executableName)
        : path.resolve(directory || ".", executableName);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return fs.realpathSync(candidate);
      } catch {
        // Keep searching PATH; a missing executable is handled by client.start().
      }
    }
  }
  return undefined;
}

async function readServerVersion(command: string): Promise<ServerVersion | undefined> {
  const executablePath = resolveExecutablePath(command);
  if (!executablePath) return undefined;

  return new Promise((resolve) => {
    execFile(executablePath, ["--version"], { encoding: "utf8", timeout: 5000 }, (error, stdout) => {
      const output = stdout.trim().split(/\r?\n/, 1)[0];
      resolve(!error && output ? { executablePath, output } : undefined);
    });
  });
}

export async function activate(context: vscode.ExtensionContext): Promise<EmeraldExtensionApi> {
  const configuration = vscode.workspace.getConfiguration("emerald");
  const command = configuration.get<string>("serverPath", "emerald");
  const outputChannel = vscode.window.createOutputChannel("Emerald Language Server", { log: true });
  context.subscriptions.push(outputChannel);

  const version = await readServerVersion(command);
  let versionStatusBarItem: vscode.StatusBarItem | undefined;
  if (version) {
    outputChannel.appendLine(`Using ${version.executablePath}: ${version.output}`);
    versionStatusBarItem = vscode.window.createStatusBarItem(
      "emerald.version",
      vscode.StatusBarAlignment.Right
    );
    versionStatusBarItem.text = version.output;
    versionStatusBarItem.tooltip = version.executablePath;
    versionStatusBarItem.command = "emerald.showOutput";
    versionStatusBarItem.show();
    context.subscriptions.push(versionStatusBarItem);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("emerald.showOutput", () => outputChannel.show())
  );

  const serverOptions: ServerOptions = {
    command,
    args: ["lsp"],
    transport: TransportKind.stdio
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "emerald" },
      { scheme: "untitled", language: "emerald" }
    ],
    outputChannel
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

  return { versionStatusBarItem };
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
