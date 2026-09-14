// Config for `@vscode/test-cli`'s `vscode-test` runner, used only by
// `npm run test:integration`. This launches a real, downloaded VS Code build
// (Electron) with this extension loaded via `--extensionDevelopmentPath`, as
// opposed to `npm test`'s fast `node --test` grammar/manifest checks, which
// never start an editor at all.
//
// `npm run pretest:integration` compiles `src/test/extension.test.ts` (via
// plain `tsc`, not esbuild — these files run inside the Extension Development
// Host itself via Mocha, they are not part of the bundled `dist/extension.js`)
// to `out/test/*.test.js`, which is what `files` below picks up.
import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  mocha: {
    timeout: 20000
  }
});
