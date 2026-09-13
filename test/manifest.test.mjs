import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("manifest connects .em files to the Emerald grammar and language configuration", () => {
  const language = manifest.contributes.languages.find(({ id }) => id === "emerald");
  const grammar = manifest.contributes.grammars.find(({ language: id }) => id === "emerald");

  assert.ok(language);
  assert.ok(language.extensions.includes(".em"));
  assert.ok(grammar);
  assert.equal(grammar.scopeName, "source.emerald");
  assert.ok(fs.existsSync(path.join(root, language.configuration)));
  assert.ok(fs.existsSync(path.join(root, grammar.path)));
});
