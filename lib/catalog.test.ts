import test from "node:test";
import assert from "node:assert/strict";
import {
  addItem,
  parseStock,
  previewProduct,
  MAX_CART_LINES,
  type ShopProduct,
} from "./catalog.ts";

const products = [previewProduct];
const id = previewProduct.id;

test("sold out variants cannot enter the cart", () =>
  assert.deepEqual(addItem([], { productId: id, size: "XS", quantity: 1 }, products), []));

test("stock limits apply across repeated additions", () => {
  let cart = addItem([], { productId: id, size: "M", quantity: 2 }, products);
  cart = addItem(cart, { productId: id, size: "M", quantity: 2 }, products);
  assert.equal(cart[0].quantity, 3);
});

test("unknown or inactive products cannot enter the cart", () => {
  assert.deepEqual(addItem([], { productId: "nope", size: "M", quantity: 1 }, products), []);
  const inactive: ShopProduct = { ...previewProduct, active: false };
  assert.deepEqual(addItem([], { productId: id, size: "M", quantity: 1 }, [inactive]), []);
});

test("cart line count is capped", () => {
  const many: ShopProduct[] = Array.from({ length: MAX_CART_LINES + 2 }, (_, i) => ({
    ...previewProduct,
    id: `p${i}`,
  }));
  let cart = [] as ReturnType<typeof addItem>;
  for (const p of many) cart = addItem(cart, { productId: p.id, size: "S", quantity: 1 }, many);
  assert.equal(cart.length, MAX_CART_LINES);
});

test("stock metadata parsing ignores junk", () => {
  assert.deepEqual(parseStock('{"M":3,"L":-1,"XL":"x","S":2.5}'), {
    XS: 0, S: 0, M: 3, L: 0, XL: 0, XXL: 0,
  });
  assert.equal(parseStock("not json").M, 0);
});
