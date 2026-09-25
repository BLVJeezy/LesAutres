/** Pure, time-based animation helpers shared by the viewer and tests. */
export const TURN = Math.PI * 2;
export const COLOR_TURN_SECONDS = 1.2;
export const AUTO_TURN_SPEED = TURN / 38;
export const smoothStep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
export function colorTurn(elapsed: number) {
  const progress = Math.min(1, Math.max(0, elapsed / COLOR_TURN_SECONDS));
  return {
    done: progress === 1,
    turn: TURN * smoothStep(progress),
    mix: smoothStep((progress - 0.12) / 0.65),
    lift: Math.sin(progress * Math.PI) * 0.065,
    lean: Math.sin(progress * Math.PI * 2) * 0.055,
  };
}

export const nextFrontAngle = (angle: number) =>
  Math.ceil((angle + Math.PI) / TURN) * TURN;
