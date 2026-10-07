import { requireAdmin } from "@/lib/admin-auth";
import { money } from "@/lib/catalog";
import { listAbandonedCheckouts, listProducts } from "@/lib/shop";

const fmt = (s: number) =>
  new Date(s * 1000).toLocaleString("nl-BE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

export default async function Checkouts() {
  await requireAdmin();
  const [checkouts, products] = await Promise.all([
    listAbandonedCheckouts().catch(() => []),
    listProducts().catch(() => []),
  ]);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const withEmail = checkouts.filter((c) => c.email);
  const value = checkouts.reduce((n, c) => n + c.total, 0);
  const reminded = checkouts.filter((c) => c.reminderSentAt).length;
  return (
    <>
      <div className="admin-head">
        <h1>Verlaten checkouts</h1>
      </div>
      <section className="admin-card">
        <div className="admin-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <div><span>Niet betaald</span><b>{checkouts.length}</b></div>
          <div><span>Gemiste omzet</span><b>{money(value)}</b></div>
          <div style={{ borderRight: 0 }}><span>Herinnering gestuurd</span><b>{reminded}</b></div>
        </div>
        {checkouts.length ? (
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Klant</th>
                  <th className="admin-hide-mobile">Adres</th>
                  <th>Artikelen</th>
                  <th className="num">Totaal</th>
                  <th className="admin-hide-mobile">Herinnering</th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map((c) => (
                  <tr key={c.id}>
                    <td>{fmt(c.created)}</td>
                    <td className="strong">
                      {c.email ? (
                        <>
                          {c.name || "—"}
                          <br />
                          <a href={`mailto:${c.email}`} style={{ textDecoration: "none", fontWeight: 400 }}>{c.email}</a>
                          {c.phone && (
                            <>
                              <br />
                              <a href={`tel:${c.phone}`} style={{ textDecoration: "none", fontWeight: 400 }}>{c.phone}</a>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="badge info">Express · geen gegevens</span>
                      )}
                    </td>
                    <td className="admin-hide-mobile">{c.address || "—"}</td>
                    <td>
                      {c.lines.map(([pid, size, qty]) => (
                        <div key={`${pid}-${size}`}>{qty}× {name(pid)} · {size}</div>
                      ))}
                    </td>
                    <td className="num">{money(c.total)}</td>
                    <td className="admin-hide-mobile">
                      {c.reminderSentAt ? fmt(Math.floor(c.reminderSentAt / 1000)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-note">Nog geen verlaten checkouts.</p>
        )}
        {withEmail.length > 0 && (
          <p className="admin-note">
            Klanten met een e-mailadres krijgen na 1 uur automatisch één herinnering. Je kunt ze ook zelf mailen of bellen.
          </p>
        )}
      </section>
    </>
  );
}
