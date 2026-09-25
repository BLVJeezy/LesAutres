import test from "node:test";
import assert from "node:assert/strict";
import {
  colorTurn,
  COLOR_TURN_SECONDS,
  TURN,
  nextFrontAngle,
} from "./scene-motion.ts";
test("colour choreography starts at the visible pose and ends without residual tilt", () => {
  const start = colorTurn(0),
    end = colorTurn(COLOR_TURN_SECONDS);
  assert.equal(start.turn, 0);
  assert.equal(start.mix, 0);
  assert.equal(end.turn, TURN);
  assert.equal(end.mix, 1);
  assert.equal(end.done, true);
  assert.ok(Math.abs(end.lean) < 1e-10);
  assert.ok(Math.abs(end.lift) < 1e-10);
});
test("colour blending is monotonic through the turn", () => {
  let previous = 0;
  for (let t = 0; t <= COLOR_TURN_SECONDS; t += 0.01) {
    const { mix } = colorTurn(t);
    assert.ok(mix >= previous && mix <= 1);
    previous = mix;
  }
});
test("changing colour lands on the front even after manual rotation", () => {
  for (const angle of [-20, -1, 0, 2, 4, 18]) {
    const end = nextFrontAngle(angle);
    assert.ok(end - angle >= Math.PI);
    assert.ok(end - angle < Math.PI + TURN);
    assert.ok(Math.abs(Math.sin(end)) < 1e-10);
  }
});
