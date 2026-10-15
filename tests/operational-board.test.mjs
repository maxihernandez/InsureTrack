import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(new URL("../app/operational-board.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
});
const testModule = { exports: {} };
vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports,
  require: name => name === "@/lib/pin-colors" ? { pinColorValue: color => `color-${color}` } : require(name) });

test("board derives initials from an agent", () => {
  assert.equal(testModule.exports.initials("Ana", "Martínez"), "AM");
});

test("board renders real policy pins, goals and an accessible selection control", () => {
  const tree = React.createElement(testModule.exports.OperationalBoard, {
    periodLabel: "October 2026", isManager: true,
    products: [{ id: "auto", name: "Auto", code: "AUTO", target_count: 12, mtd_count: 1, ytd_count: 8 }],
    pins: [{ id: "sale-1", product_id: "auto", policy_number: "P-101", policy_status: "in_force", sale_date: "2026-10-06", agent_id: "agent-1", first_name: "Ana", last_name: "Martínez", pin_color: 1 }],
  });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Operational board/);
  assert.match(html, /Auto/);
  assert.match(html, /AM/);
  assert.match(html, /View Ana Martínez/);
  assert.match(html, /1 \/ 12/);
});
