import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function harness() {
  let selected = 0;
  let focused = null;
  const refs = { current: [0, 1, 2].map(index => ({ focus: () => { focused = index; } })) };
  const { outputText } = ts.transpileModule(readFileSync(new URL("../app/dashboard-steps.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports,
    require: name => name === "react" ? { ...React, useState: () => [selected, value => { selected = value; }],
      useId: () => "steps", useRef: () => refs } : require(name) });
  const props = { production: "Production data", ranking: "Ranking data", commercial: "Commercial data" };
  const render = (overrides = {}) => testModule.exports.DashboardSteps({ ...props, ...overrides });
  return { render, get focused() { return focused; } };
}
function findRole(node, role) {
  if (!React.isValidElement(node)) return [];
  return [...(node.props.role === role ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => findRole(child, role))];
}

test("stepper initially shows only Production and associates all tabs with panels", () => {
  const h = harness();
  const tree = h.render();
  const tabs = findRole(tree, "tab");
  const panels = findRole(tree, "tabpanel");
  assert.equal(tabs.length, 3); assert.equal(panels.length, 3);
  assert.deepEqual(panels.map(panel => panel.props.hidden), [false, true, true]);
  tabs.forEach((tab, index) => {
    assert.equal(tab.props["aria-controls"], panels[index].props.id);
    assert.equal(tab.props.id, panels[index].props["aria-labelledby"]);
  });
  assert.match(renderToStaticMarkup(tree), /Dashboard sections/);
});

test("clicks and keyboard arrows/Home/End select steps and move keyboard focus", () => {
  const h = harness();
  findRole(h.render(), "tab")[2].props.onClick();
  assert.deepEqual(findRole(h.render(), "tabpanel").map(panel => panel.props.hidden), [true, true, false]);
  for (const [from, key, expected] of [[2, "ArrowRight", 0], [0, "ArrowLeft", 2], [2, "Home", 0], [0, "End", 2]]) {
    let prevented = false;
    findRole(h.render(), "tab")[from].props.onKeyDown({ key, preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true); assert.equal(h.focused, expected);
    assert.equal(findRole(h.render(), "tab")[expected].props["aria-selected"], true);
  }
});

test("monthly history keeps all sections visible without step controls", () => {
  const tree = harness().render({ enabled: false });
  assert.equal(findRole(tree, "tablist").length, 0);
  const html = renderToStaticMarkup(tree);
  for (const text of ["Production data", "Ranking data", "Commercial data"]) assert.ok(html.includes(text));
  assert.ok(!html.includes("hidden"));
});
