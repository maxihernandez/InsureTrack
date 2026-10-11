import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports, FormData,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) });
  return testModule.exports;
}

const validation = load("../lib/production/validation.ts", { "@/lib/validation": load("../lib/validation.ts") });
const id = "12345678-1234-1234-1234-123456789012";

function saleForm(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ product_id: id, sale_date: "2026-10-10", policy_number: " POL-123 ", premium: "", amount: "", notes: "", ...overrides })) form.set(key, value);
  return form;
}

test("a policy number is mandatory and normalized when recording a policy", () => {
  const valid = validation.readCreateSale(saleForm(), id);
  assert.equal(valid.policyNumber, "POL-123");
  assert.equal(validation.readCreateSale(saleForm({ policy_number: "   " }), id), null);
  assert.equal(validation.readCreateSale(saleForm({ policy_number: "x".repeat(101) }), id), null);
});

test("only in-force policies require an effective date", () => {
  const update = overrides => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ sale_id: id, policy_status: "issued", effective_date: "", ...overrides })) form.set(key, value);
    return validation.readPolicyStatusUpdate(form);
  };
  assert.equal(JSON.stringify(update()), JSON.stringify({ saleId: id, status: "issued", effectiveDate: null }));
  assert.equal(update({ policy_status: "in_force" }), null);
  assert.equal(JSON.stringify(update({ policy_status: "in_force", effective_date: "2026-10-10" })), JSON.stringify({ saleId: id, status: "in_force", effectiveDate: "2026-10-10" }));
  assert.equal(update({ policy_status: "legacy" }), null);
});