import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import oniguruma from "vscode-oniguruma";
import textmate from "vscode-textmate";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const grammarPath = path.join(root, "syntaxes", "emerald.tmLanguage.json");

const wasm = fs.readFileSync(
  path.join(root, "node_modules", "vscode-oniguruma", "release", "onig.wasm")
);
await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));

const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (text) => new oniguruma.OnigString(text)
  }),
  loadGrammar: async (scopeName) => {
    if (scopeName !== "source.emerald") return null;
    return textmate.parseRawGrammar(fs.readFileSync(grammarPath, "utf8"), grammarPath);
  }
});

const grammar = await registry.loadGrammar("source.emerald");
assert.ok(grammar);

function tokenize(lines) {
  let stack = textmate.INITIAL;
  return lines.map((line) => {
    const result = grammar.tokenizeLine(line, stack);
    stack = result.ruleStack;
    return { line, tokens: result.tokens };
  });
}

function scopesFor(result, text) {
  const start = result.line.indexOf(text);
  assert.notEqual(start, -1, `fixture does not contain ${JSON.stringify(text)}`);
  const token = result.tokens.find((candidate) => candidate.startIndex <= start && candidate.endIndex > start);
  assert.ok(token, `no token covers ${JSON.stringify(text)}`);
  return token.scopes;
}

test("highlights declarations, built-in types, predicates, and annotations", () => {
  const lines = tokenize([
    "@override",
    "struct Student {",
    "    func passing?(): Bool {",
    "        const score: Int = 82",
    "        const lookup: Dict[String, List[Int]] = []",
    "        const seen: Set[String] = []"
  ]);

  assert.ok(scopesFor(lines[0], "override").includes("storage.modifier.annotation.emerald"));
  assert.ok(scopesFor(lines[1], "Student").includes("entity.name.type.emerald"));
  assert.ok(scopesFor(lines[2], "passing?").includes("entity.name.function.emerald"));
  assert.ok(scopesFor(lines[2], "Bool").includes("support.type.builtin.emerald"));
  assert.ok(scopesFor(lines[3], "score").includes("variable.other.definition.emerald"));
  assert.ok(scopesFor(lines[3], "Int").includes("support.type.builtin.emerald"));
  assert.ok(scopesFor(lines[3], "82").includes("constant.numeric.emerald"));
  assert.ok(scopesFor(lines[4], "Dict").includes("support.type.builtin.emerald"));
  assert.ok(scopesFor(lines[4], "List").includes("support.type.builtin.emerald"));
  assert.ok(scopesFor(lines[5], "Set").includes("support.type.builtin.emerald"));
});

test("keeps interpolation as Emerald code inside a string", () => {
  const [line] = tokenize(["const message = \"Hello, #{student.name.upper()}!\""]);

  assert.ok(scopesFor(line, "Hello").includes("string.quoted.double.emerald"));
  assert.ok(scopesFor(line, "student").includes("meta.embedded.expression.emerald"));
  assert.ok(scopesFor(line, "name").includes("variable.other.member.emerald"));
  assert.ok(scopesFor(line, "upper").includes("entity.name.function.member.emerald"));
});

test("treats keyword-named methods as members after a dot", () => {
  const [line] = tokenize(["const result = parsed.or(0)"]);

  assert.ok(scopesFor(line, "or").includes("entity.name.function.member.emerald"));
});

test("highlights namespace aliases", () => {
  const [line] = tokenize(["using Text = Emerald.Standard.Text"]);

  assert.ok(scopesFor(line, "using").includes("keyword.control.import.emerald"));
  assert.ok(scopesFor(line, "Text").includes("entity.name.namespace.alias.emerald"));
  assert.ok(scopesFor(line, "Emerald").includes("entity.name.namespace.emerald"));
});

test("distinguishes raw strings and nested block comments", () => {
  const lines = tokenize([
    "const path = 'C:\\\\Users\\\\Ava'",
    "#[ outer",
    "   #[ nested ]#",
    "still outer ]#",
    "const visible = true"
  ]);

  assert.ok(scopesFor(lines[0], "\\\\").includes("string.quoted.single.raw.emerald"));
  assert.ok(scopesFor(lines[2], "nested").includes("comment.block.emerald"));
  assert.ok(scopesFor(lines[3], "outer").includes("comment.block.emerald"));
  assert.ok(!scopesFor(lines[4], "const").includes("comment.block.emerald"));
  assert.ok(scopesFor(lines[4], "true").includes("constant.language.boolean.emerald"));
});

test("marks documentation comments separately from ordinary comments", () => {
  const lines = tokenize(["## Student documentation", "# ordinary note"]);

  assert.ok(scopesFor(lines[0], "Student").includes("comment.line.documentation.emerald"));
  assert.ok(scopesFor(lines[1], "ordinary").includes("comment.line.number-sign.emerald"));
});
