import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function renderShell(role = "manager", pathname = "/team/manage") {
  const { outputText } = ts.transpileModule(readFileSync(new URL("../app/app-shell.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const testModule = { exports: {} };
  const mocks = {
    "next/link": { __esModule: true, default: props => React.createElement("a", props) },
    "next/navigation": { usePathname: () => pathname },
    "@/app/login/actions": { logout: async () => {} },
  };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) });
  return renderToStaticMarkup(React.createElement(testModule.exports.AppShell, {
    user: { first_name: "Test", role },
  }, React.createElement("p", null, "Page content")));
}

test("desktop sidebar stays within viewport with independent menu scrolling and a pinned footer", () => {
  const html = renderShell();
  const aside = html.match(/<aside[^>]*>/)[0];
  assert.match(aside, /md:sticky/);
  assert.match(aside, /md:top-0/);
  assert.match(aside, /md:h-dvh/);
  assert.match(aside, /md:overflow-hidden/);
  assert.match(html, /aria-label="Main navigation" class="[^"]*min-h-0[^"]*overflow-y-auto[^"]*overscroll-contain/);
  assert.match(html, /class="[^"]*shrink-0[^"]*border-t[^"]*border-zinc-200[^"]*pt-4/);
  assert.match(html, /aria-label="Unpin sidebar"/);
  assert.match(html, /transition-\[width\]/);
  assert.match(html, /<main[^>]*>.*Page content/);
});

test("logout is an accessible submit button and manager navigation is restricted", () => {
  const manager = renderShell();
  assert.equal((manager.match(/>Logout<\/button>/g) ?? []).length, 1);
  assert.equal((manager.match(/type="submit"/g) ?? []).length, 2);
  assert.match(manager, /aria-label="Log out"/);
  assert.match(manager, /min-h-11/);
  assert.match(manager, /focus-visible:outline-2/);
  assert.match(manager, /href="\/goals"/);
  assert.match(manager, /href="\/team" aria-current="page"/);
  assert.doesNotMatch(manager, /href="\/production"/);
  const agent = renderShell("agent");
  assert.doesNotMatch(agent, /href="\/team"/);
  assert.doesNotMatch(agent, /href="\/history"/);
  assert.doesNotMatch(agent, /href="\/goals"/);
  assert.match(manager, /aria-label="Mobile navigation"/);
});
