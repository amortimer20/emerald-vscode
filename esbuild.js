// Bundles `src/extension.ts` into the single `dist/extension.js` the manifest's
// `main` field points to. Bundling (rather than shipping `node_modules`) is
// what lets `npm run package` keep using `vsce package --no-dependencies`: the
// packaged extension needs nothing from `node_modules` at runtime, including
// `vscode-languageclient` itself.
//
// `--production` drops the source map and minifies, for `vscode:prepublish`
// (which `vsce package` runs automatically before bundling the `.vsix`).
// `--watch` is for `npm run watch` during development.

const esbuild = require("esbuild");
const fs = require("node:fs");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// A leftover source map from an earlier plain `npm run compile` would
// otherwise survive a later `--production` build untouched — esbuild only
// writes what a given build actually produces, it does not clean up what a
// *previous, differently configured* one left behind.
fs.rmSync("dist", { recursive: true, force: true });

// `.vscode/tasks.json`'s background problem matcher watches stdout for these
// two exact lines to know when a rebuild starts and finishes.
const watchNotifyPlugin = {
  name: "watch-notify",
  setup(build) {
    build.onStart(() => console.log("[watch] build started"));
    build.onEnd((result) => {
      for (const error of result.errors) {
        console.error(`> ${error.location?.file ?? "?"}: ${error.text}`);
      }
      console.log("[watch] build finished");
    });
  }
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node18",
    outfile: "dist/extension.js",
    external: ["vscode"],
    sourcemap: !production,
    minify: production,
    logLevel: "silent",
    plugins: [watchNotifyPlugin]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
