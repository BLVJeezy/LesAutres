import test from "node:test";
import assert from "node:assert/strict";
import { addItem, availability } from "./catalog.ts";
test("sold out variants cannot enter the cart", () =>
  assert.deepEqual(
    addItem([], { color: "white-black", size: "XS", quantity: 1 }),
    [],
  ));
test("stock limits apply across repeated additions", () => {
  let cart = addItem([], { color: "white-black", size: "M", quantity: 2 });
  cart = addItem(cart, { color: "white-black", size: "M", quantity: 2 });
  assert.equal(cart[0].quantity, 3);
});
test("stock and preorders coexist", () => {
  assert.equal(availability("white-black", "M").kind, "stock");
  assert.equal(availability("white-black", "XL").kind, "preorder");
});
