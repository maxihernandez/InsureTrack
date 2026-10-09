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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports, process,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) });
  return testModule.exports;
}
const summary = load("../lib/report-summary.ts");
const month = (key, sales = 0, goal = null, goalSales = 0, premium = "0") => ({ month: key, sales, goal, goal_sales: goalSales, premium, amount: "0" });

test("rolling report range contains 12 full calendar months across year boundaries", () => {
  const range = summary.reportRange("2026-01");
  assert.equal(range.start, "2025-02-01"); assert.equal(range.end, "2026-02-01");
  assert.equal(summary.reportRange("2024-02").start, "2023-03-01");
  assert.equal(summary.reportRange("2026-01", 3).start, "2025-11-01");
  assert.equal(summary.reportRange("2026-01", 6).start, "2025-08-01");
  assert.equal(summary.parseReportRange("3"), 3); assert.equal(summary.parseReportRange("6"), 6);
  assert.equal(summary.parseReportRange("24"), 12); assert.equal(summary.parseReportRange(undefined), 12);
});

test("report summary excludes unassigned goals from achievement and handles missing baselines", () => {
  const result = summary.reportSummary([month("2026-01", 50, null, 0, "10.25"), month("2026-02", 10, 20, 5, "20.25")]);
  assert.equal(result.sales, 60); assert.equal(result.premium, 30.5);
  assert.equal(result.achievement, 25); assert.equal(result.best.month, "2026-01"); assert.equal(result.change, -80);
  const empty = summary.reportSummary([month("2026-01"), month("2026-02")]);
  assert.equal(empty.best, null); assert.equal(empty.achievement, null); assert.equal(empty.change, null);
  assert.equal(summary.reportSummary([month("2026-01", 5), month("2026-02", 10)]).change, 100);
  assert.equal(summary.reportSummary([month("2026-01", 2, 0)]).achievement, null);
});

test("report charts handle zero sales and missing goals without invalid SVG coordinates", () => {
  const charts = load("../app/(authenticated)/history/report-charts.tsx", { "@/lib/report-summary": summary });
  const months = [month("2026-01"), month("2026-02", 10, 5, 10, "250.50")];
  for (const premium of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(charts.MonthlyChart, { months, premium }));
    assert.match(html, /role="img"/); assert.match(html, /monthly breakdown/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
  const zero = renderToStaticMarkup(React.createElement(charts.MonthlyChart, { months: [month("2026-01")] }));
  assert.doesNotMatch(zero, /NaN|Infinity/);
  assert.match(renderToStaticMarkup(React.createElement(charts.DistributionChart, { rows: [], total: 0 })), /No production/);
});

test("report sections use icon tabs and reveal only the selected panel", () => {
  let selected = 0;
  const refs = { current: [0, 1, 2].map(() => ({ focus: () => {} })) };
  const { outputText } = ts.transpileModule(readFileSync(new URL("../app/report-sections.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports,
    require: name => name === "react" ? { ...React, useState: () => [selected, value => { selected = value; }], useId: () => "reports", useRef: () => refs } : require(name) });
  const render = () => testModule.exports.ReportSections({ trends: "Trend content", distribution: "Distribution content", breakdown: "Breakdown content" });
  const findRole = (node, role) => !React.isValidElement(node) ? [] : [...(node.props.role === role ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => findRole(child, role))];
  let tree = render();
  const tabs = findRole(tree, "tab");
  assert.equal(findRole(tree, "tablist").length, 1); assert.equal(tabs.length, 3);
  assert.deepEqual(findRole(tree, "tabpanel").map(panel => panel.props.hidden), [false, true, true]);
  assert.match(renderToStaticMarkup(tree), /<svg/);
  tabs[1].props.onClick();
  tree = render();
  assert.deepEqual(findRole(tree, "tabpanel").map(panel => panel.props.hidden), [true, false, true]);
});
test("report queries are bounded, parameterized and do not drop inactive historical accounts", async () => {
  const queries = [];
  const sql = async (parts, ...values) => { queries.push({ text: parts.join("?").replace(/\s+/g, " "), values }); return []; };
  const reports = load("../lib/reports.ts", { "server-only": {}, "@/lib/db": { getDb: () => sql }, "@/lib/report-summary": summary });
  await reports.getHistoricalReport("2026-09");
  assert.equal(queries.length, 3);
  for (const query of queries) {
    assert.ok(query.values.includes("2025-10-01")); assert.ok(query.values.includes("2026-10-01"));
    assert.match(query.text, /current_date \+ 1/);
    assert.doesNotMatch(query.text, /u.active|p.active|delete|update|insert/i);
  }
  assert.match(queries[0].text, /generate_series/);
  assert.match(queries[0].text, /count\(\*\) filter \(where g.target_count > 0\)/);
});

test("integration: historical report totals match raw sales; read-only", {
  skip: process.env.POLICYBOARD_DB_TEST !== "1", timeout: 45000,
}, async () => {
  const database = load("../lib/db.ts", { "server-only": {} });
  const sql = database.getDb();
  const reports = load("../lib/reports.ts", { "server-only": {}, "@/lib/db": database, "@/lib/report-summary": summary });
  try {
    const endMonth = new Date().toISOString().slice(0, 7);
    const report = await reports.getHistoricalReport(endMonth);
    assert.equal(report.months.length, 12);
    assert.equal(report.months[0].month, report.start.slice(0, 7));
    assert.equal(report.months.at(-1).month, endMonth);
    const [actual] = await sql`select count(*)::int as sales, coalesce(sum(premium), 0)::text as premium
      from policyboard.sales where sale_date >= ${report.start}::date and sale_date < least(${report.end}::date, current_date + 1)`;
    const result = summary.reportSummary(report.months);
    assert.equal(result.sales, actual.sales);
    assert.ok(Math.abs(result.premium - Number(actual.premium)) < 0.001);
    assert.equal(report.products.reduce((total, item) => total + item.sales, 0), actual.sales);
    assert.equal(report.agents.reduce((total, item) => total + item.sales, 0), actual.sales);
    for (const item of report.months) assert.ok(item.goal_sales <= item.sales);
  } finally { await sql.end({ timeout: 2 }); }
});
