import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleTotal, cartDiscount } from "./bundles.ts";

test("bundle totals", () => {
  assert.equal(bundleTotal(1, 4495), 4495);
  assert.equal(bundleTotal(2, 4495), 7995);
  assert.equal(bundleTotal(3, 4495), 10995);
  assert.equal(bundleTotal(4, 4495), 14660);
  assert.equal(bundleTotal(5, 4495), 18325);
  assert.equal(bundleTotal(6, 4495), 2 * 10995);
});

test("cart discount mixes sizes and ignores other products", () => {
  const cart = [
    { productId: "baddies-tee", quantity: 1 },
    { productId: "baddies-tee", quantity: 1 },
    { productId: "baddies-tee", quantity: 1 },
    { productId: "hoodie", quantity: 2 },
  ];
  assert.equal(cartDiscount(cart, () => 4495), 3 * 4495 - 10995);
  assert.equal(cartDiscount([{ productId: "baddies-tee", quantity: 1 }], () => 4495), 0);
});
