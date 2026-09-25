import { useId } from "react";
import type { Colorway } from "@/lib/catalog";
export function ShirtFallback({ color }: { color: Colorway }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="shirt-fallback"
      viewBox="0 0 600 600"
      role="img"
      aria-label={`Drop 001 T-shirt in ${color.name}`}
    >
      <defs>
        <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor={color.fabric} />
          <stop offset=".5" stopColor={color.fabric} />
          <stop offset="1" stopColor="#777" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="10" dy="22" stdDeviation="18" floodOpacity=".45" />
        </filter>
      </defs>
      <ellipse cx="300" cy="545" rx="125" ry="13" fill="#000" opacity=".4" />
      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M238 89 Q300 119 362 89 L427 120 516 235 440 286 407 248 409 505 Q300 515 191 505 L193 248 160 286 84 235 173 120Z"
          fill={`url(#${id}-cloth)`}
        />
        <path
          d="M238 89 Q300 165 362 89"
          fill="none"
          stroke="#b8b6af"
          strokeWidth="13"
        />
        <path
          d="M193 489 Q300 499 409 489 M103 223 162 267 M497 223 438 267"
          fill="none"
          stroke="#a9a79f"
          strokeOpacity=".5"
        />
        <g
          fontFamily="Impact,Arial Narrow,sans-serif"
          fontWeight="900"
          textAnchor="middle"
        >
          <text x="300" y="236" fontSize="46" fill={color.accent}>
            BADDIES
          </text>
          {["IN BELGICA,", "HOLLANDA,", "FRANSA,", "ESPAGNA"].map((t, i) => (
            <text
              key={t}
              x="300"
              y={272 + i * 34}
              fontSize="34"
              fill={color.ink}
            >
              {t}
            </text>
          ))}
        </g>
        <path d="M384 480h20v27h-20z" fill="#171717" />
        <text
          x="394"
          y="496"
          fill="white"
          fontSize="6"
          textAnchor="middle"
          fontStyle="italic"
        >
          LA
        </text>
      </g>
    </svg>
  );
}
