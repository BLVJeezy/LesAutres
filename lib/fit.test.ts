import test from "node:test";
import assert from "node:assert/strict";
import { adviseSize } from "./fit.ts";

test("size advice", () => {
  assert.equal(adviseSize(178, 72), "M");
  assert.equal(adviseSize(185, 80), "L");
  assert.equal(adviseSize(185, 100), "XL");
  assert.equal(adviseSize(168, 55), "S");
  assert.equal(adviseSize(160, 50), "XS");
  assert.equal(adviseSize(198, 95), "XXL");
  assert.equal(adviseSize(10, 50), null);
});
