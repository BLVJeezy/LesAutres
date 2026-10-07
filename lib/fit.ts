import type { Size } from "./catalog";

/** Size advice for the boxy/oversized tee from height (cm) and weight (kg). */
export function adviseSize(height: number, weight: number): Size | null {
  if (!(height >= 140 && height <= 220) || !(weight >= 35 && weight <= 200)) return null;
  const order: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
  let i = height < 165 ? 0 : height < 172 ? 1 : height < 180 ? 2 : height < 188 ? 3 : height < 195 ? 4 : 5;
  const bmi = weight / (height / 100) ** 2;
  if (bmi >= 30) i += 2;
  else if (bmi >= 26.5) i += 1;
  else if (bmi < 19 && i > 0) i -= 1;
  return order[Math.min(order.length - 1, Math.max(0, i))];
}
