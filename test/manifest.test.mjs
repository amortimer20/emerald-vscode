import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("manifest uses an extension identity that does not collide with emerald-lang.emerald-lang", () => {
  assert.equal(`${manifest.publisher}.${manifest.name}`, "emerald-lang.emerald-vscode");
});

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

test("manifest contributes the starter Emerald snippets", () => {
  const snippet = manifest.contributes.snippets.find(({ language }) => language === "emerald");
  assert.ok(snippet);

  const snippets = JSON.parse(fs.readFileSync(path.join(root, snippet.path), "utf8"));
  assert.deepEqual(Object.keys(snippets), [
    "Variable declaration",
    "Constant declaration",
    "Struct declaration",
    "Class declaration",
    "Trait declaration",
    "Enum declaration",
    "Function declaration",
    "If statement",
    "While loop",
    "For loop",
    "Case statement",
    "Try statement",
    "Lambda",
    "Test function",
    "Override method",
    "Abstract class",
    "Constructor",
    "Read-only property",
    "Writable property",
    "Type-level function",
    "Function with defaults",
    "Raise error",
    "Try-finally statement",
    "File with open",
    "Using namespace",
    "Using alias",
    "Named-argument call",
    "Method call",
    "Method chain"
  ]);
  assert.deepEqual(snippets["Variable declaration"].prefix, "var");
  assert.deepEqual(snippets["Constant declaration"].prefix, "const");
  assert.deepEqual(snippets["Struct declaration"].prefix, "struct");
  assert.deepEqual(snippets["Class declaration"].prefix, "class");
  assert.deepEqual(snippets["Trait declaration"].prefix, "trait");
  assert.deepEqual(snippets["Enum declaration"].prefix, "enum");
  assert.deepEqual(snippets["Function declaration"].prefix, "func");
  assert.deepEqual(snippets["If statement"].prefix, "if");
  assert.deepEqual(snippets["While loop"].prefix, "while");
  assert.deepEqual(snippets["For loop"].prefix, "for");
  assert.deepEqual(snippets["Case statement"].prefix, "case");
  assert.deepEqual(snippets["Try statement"].prefix, "try");
  assert.deepEqual(snippets["Lambda"].prefix, "lambda");
  assert.deepEqual(snippets["Test function"].prefix, "test");
  assert.deepEqual(snippets["Override method"].prefix, "override");
  assert.deepEqual(snippets["Abstract class"].prefix, "abstract");
  assert.deepEqual(snippets["Constructor"].prefix, "constructor");
  assert.deepEqual(snippets["Read-only property"].prefix, "property");
  assert.deepEqual(snippets["Writable property"].prefix, "property-set");
  assert.deepEqual(snippets["Type-level function"].prefix, "typefunc");
  assert.deepEqual(snippets["Function with defaults"].prefix, "func-default");
  assert.deepEqual(snippets["Raise error"].prefix, "raise");
  assert.deepEqual(snippets["Try-finally statement"].prefix, "try-finally");
  assert.deepEqual(snippets["File with open"].prefix, "with-open");
  assert.deepEqual(snippets["Using namespace"].prefix, "using");
  assert.deepEqual(snippets["Using alias"].prefix, "using-alias");
  assert.deepEqual(snippets["Named-argument call"].prefix, "call-named");
  assert.deepEqual(snippets["Method call"].prefix, "method");
  assert.deepEqual(snippets["Method chain"].prefix, "chain");
});

test("manifest and package include the Emerald extension artwork", () => {
  const icon = fs.readFileSync(path.join(root, manifest.icon));

  assert.equal(manifest.icon, "icons/emerald.png");
  assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(fs.existsSync(path.join(root, "icons/emerald.svg")));
});
