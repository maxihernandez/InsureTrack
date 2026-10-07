import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) });
  return testModule.exports;
}
const validation = load("../lib/agent-validation.ts", { "@/lib/validation": load("../lib/validation.ts") });
function inputs(node) {
  if (!React.isValidElement(node)) return [];
  return [...(node.type === "input" ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(inputs)];
}

test("create fields show a live read-only username preview and optional email", () => {
  let cursor = 0;
  const state = ["", ""];
  const component = load("../app/(authenticated)/team/manage/profile-fields.tsx", {
    "@/lib/agent-validation": validation,
    react: { useState: () => { const index = cursor++; return [state[index], value => { state[index] = value; }]; } },
  });
  const render = () => { cursor = 0; return component.ProfileFields({ reservedUsernames: ["MHernandez", "mhernandez1"] }); };
  const initial = inputs(render());
  initial.find(input => input.props.name === "first_name").props.onChange({ target: { value: "Maximiliano" } });
  initial.find(input => input.props.name === "last_name").props.onChange({ target: { value: "Hernández" } });
  const tree = render();
  const fields = inputs(tree);
  const username = fields.find(input => input.props.readOnly);
  assert.equal(username.props.value, "mhernandez2");
  assert.equal(username.props.name, undefined);
  const email = fields.find(input => input.props.name === "email");
  assert.equal(email.props.type, "email"); assert.equal(email.props.required, undefined);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Username/); assert.match(html, /Email/); assert.match(html, /optional/);
  assert.doesNotMatch(html, /If taken/);
});

test("editing names does not silently regenerate an existing account username", () => {
  const component = load("../app/(authenticated)/team/manage/profile-fields.tsx", { "@/lib/agent-validation": validation });
  const html = renderToStaticMarkup(React.createElement(component.ProfileFields, {
    agent: { first_name: "Ana", last_name: "Perez", username: "existing-login", email: null },
  }));
  assert.match(html, /value="existing-login"/); assert.doesNotMatch(html, /readonly/);
  assert.match(html, /optional/);
});
