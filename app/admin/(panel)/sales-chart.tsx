"use client";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/catalog";

export type Day = { date: string; label: string; revenue: number; orders: number };

const H = 220;
const PAD = { top: 12, right: 0, bottom: 24, left: 56 };

function niceMax(v: number) {
  if (v <= 0) return 10000;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
}

export function SalesChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / days.length;
  const barW = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(days.length / Math.max(3, Math.floor(plotW / 110)));
  const active = hover !== null ? days[hover] : null;

  return (
    <div className="admin-chart" ref={box} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Omzet per dag">
        <g className="grid">
          {ticks.map((t) => (
            <line key={t} x1={PAD.left} x2={W} y1={y(t)} y2={y(t)} />
          ))}
        </g>
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
              {money(t).replace(/,00$/, "")}
            </text>
          ))}
          {days.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={d.date} x={PAD.left + slot * i + slot / 2} y={H - 6} textAnchor="middle">
                {d.label}
              </text>
            ) : null,
          )}
        </g>
        {days.map((d, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const h = Math.max(0, plotH - (y(d.revenue) - PAD.top));
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.date}>
              <rect
                className="hit"
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                onMouseEnter={() => setHover(i)}
                onClick={() => setHover(i)}
              />
              {h > 0 && (
                <path
                  className={`bar ${hover === i ? "active" : ""}`}
                  d={`M${x},${PAD.top + plotH} V${PAD.top + plotH - h + r} Q${x},${PAD.top + plotH - h} ${x + r},${PAD.top + plotH - h} H${x + barW - r} Q${x + barW},${PAD.top + plotH - h} ${x + barW},${PAD.top + plotH - h + r} V${PAD.top + plotH} Z`}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}
      </svg>
      {active && hover !== null && (
        <div
          className="admin-tooltip"
          style={{
            left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`,
            top: `${(y(active.revenue) / H) * 100}%`,
            transform:
              hover > days.length * 0.8
                ? "translate(calc(-100% + 12px), calc(-100% - 8px))"
                : hover < days.length * 0.2
                  ? "translate(-12px, calc(-100% - 8px))"
                  : undefined,
          }}
        >
          {active.label}
          <b>{money(active.revenue)}</b>
          {active.orders} bestelling{active.orders === 1 ? "" : "en"}
        </div>
      )}
      <table className="sr-only">
        <caption>Omzet per dag</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th>{d.label}</th>
              <td>{money(d.revenue)}</td>
              <td>{d.orders} bestellingen</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
