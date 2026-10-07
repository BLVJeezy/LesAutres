"use client";
import { useMemo, useState } from "react";

export type PickOrder = {
  id: string;
  number: number;
  created: number;
  shippedAt: number | null;
  name: string;
  city: string;
  items: string;
  units: number;
};

type Period = "all" | "today" | "48h" | "7d" | "since" | "custom";
const PERIODS: [Period, string][] = [
  ["all", "Alles"],
  ["today", "Vandaag"],
  ["48h", "48 uur"],
  ["7d", "7 dagen"],
  ["since", "Sinds laatste verzending"],
  ["custom", "Datum kiezen"],
];

const dayStart = (d: string) => Math.floor(new Date(`${d}T00:00:00`).getTime() / 1000);
const fmt = (s: number) =>
  new Date(s * 1000).toLocaleString("nl-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

export function ExportPicker({
  orders,
  lastShipped,
  initialType,
}: {
  orders: PickOrder[];
  lastShipped: number | null;
  initialType: "labels" | "orders";
}) {
  const [type, setType] = useState(initialType);
  const [period, setPeriod] = useState<Period>("all");
  const [status, setStatus] = useState<"open" | "all">("open");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [layout, setLayout] = useState<"a6" | "a4">("a6");
  const [off, setOff] = useState<Set<string>>(new Set());

  const shown = useMemo(() => {
    const now = Date.now() / 1000;
    const since =
      period === "today" ? dayStart(new Date().toISOString().slice(0, 10))
      : period === "48h" ? now - 48 * 3600
      : period === "7d" ? now - 7 * 86400
      : period === "since" ? lastShipped ?? 0
      : period === "custom" && from ? dayStart(from)
      : 0;
    const until = period === "custom" && to ? dayStart(to) + 86400 : Infinity;
    return orders.filter(
      (o) => o.created >= since && o.created < until && (status === "all" || !o.shippedAt),
    );
  }, [orders, period, status, from, to, lastShipped]);

  const chosen = shown.filter((o) => !off.has(o.id));
  const allOn = chosen.length === shown.length;
  const toggle = (id: string) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ids = chosen.map((o) => o.id).join(",");
  const href = type === "labels" ? `/admin/labels?layout=${layout}&ids=${ids}` : `/admin/packing?ids=${ids}`;

  return (
    <>
      <div className="admin-head">
        <h1>Exporteren</h1>
      </div>
      <section className="admin-card export-card">
        <div className="export-group">
          <span className="admin-note">Wat</span>
          <div className="export-chips">
            <button aria-pressed={type === "labels"} onClick={() => setType("labels")}>Verzendlabels</button>
            <button aria-pressed={type === "orders"} onClick={() => setType("orders")}>Orderoverzicht (PDF)</button>
          </div>
        </div>
        <div className="export-group">
          <span className="admin-note">Periode</span>
          <div className="export-chips">
            {PERIODS.map(([p, label]) => (
              <button
                key={p}
                aria-pressed={period === p}
                disabled={p === "since" && !lastShipped}
                onClick={() => setPeriod(p)}
              >
                {label}
              </button>
            ))}
          </div>
          {period === "since" && lastShipped && (
            <span className="admin-note">Laatste verzending: {fmt(lastShipped)}</span>
          )}
          {period === "custom" && (
            <div className="export-dates">
              <label>
                Van <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label>
                Tot en met <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
          )}
        </div>
        <div className="export-group">
          <span className="admin-note">Status</span>
          <div className="export-chips">
            <button aria-pressed={status === "open"} onClick={() => setStatus("open")}>Nog te verzenden</button>
            <button aria-pressed={status === "all"} onClick={() => setStatus("all")}>Ook verzonden</button>
          </div>
        </div>
        {type === "labels" && (
          <div className="export-group">
            <span className="admin-note">Formaat</span>
            <div className="export-chips">
              <button aria-pressed={layout === "a6"} onClick={() => setLayout("a6")}>1 label per pagina (A6)</button>
              <button aria-pressed={layout === "a4"} onClick={() => setLayout("a4")}>8 per A4-blad</button>
            </div>
          </div>
        )}
      </section>

      <section className="admin-card">
        <div className="export-list-head">
          <label>
            <input
              type="checkbox"
              checked={shown.length > 0 && allOn}
              onChange={() => setOff(allOn ? new Set(shown.map((o) => o.id)) : new Set())}
            />
            <b>{chosen.length}</b> van {shown.length} gekozen
          </label>
        </div>
        {shown.length ? (
          <ul className="export-list">
            {shown.map((o) => (
              <li key={o.id}>
                <label>
                  <input type="checkbox" checked={!off.has(o.id)} onChange={() => toggle(o.id)} />
                  <span className="export-main">
                    <b>#{o.number} · {o.name}</b>
                    <small>{o.items}</small>
                  </span>
                  <span className="export-side">
                    <small>{fmt(o.created)}</small>
                    {o.shippedAt ? <span className="badge">verzonden</span> : <small>{o.city}</small>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Geen bestellingen in deze selectie.</p>
        )}
      </section>

      <div className="export-go">
        <a
          className={`admin-btn ${chosen.length ? "" : "disabled"}`}
          href={chosen.length ? href : undefined}
          target="_blank"
          rel="noopener"
          aria-disabled={!chosen.length}
        >
          {type === "labels" ? `Maak ${chosen.length} ${chosen.length === 1 ? "label" : "labels"}` : `Maak PDF van ${chosen.length} bestellingen`}
        </a>
      </div>
    </>
  );
}
