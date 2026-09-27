import { requireAdmin } from "@/lib/admin-auth";
import { firebaseConfigured } from "@/lib/firebase";
import { listSubscribers } from "@/lib/subscribers";
import { deleteSubscriberAction } from "../../actions";

const fmt = (ms: number) =>
  new Date(ms).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Brussels" });

export default async function Subscribers() {
  await requireAdmin();
  const subs = await listSubscribers();
  const drops = subs.filter((s) => s.type === "drop").length;
  return (
    <>
      <div className="admin-head">
        <h1>Inschrijvingen</h1>
        {subs.length > 0 && (
          <a className="admin-btn secondary" href="/admin/export/subscribers">
            Exporteer CSV
          </a>
        )}
      </div>
      <section className="admin-card">
        <div className="admin-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <div><span>Totaal</span><b>{subs.length}</b></div>
          <div><span>Nieuwe drops</span><b>{drops}</b></div>
          <div style={{ borderRight: 0 }}><span>Maat terug</span><b>{subs.length - drops}</b></div>
        </div>
        {subs.length ? (
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Lijst</th>
                  <th className="admin-hide-mobile">Datum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td className="strong">
                      <a href={`mailto:${s.email}`} style={{ textDecoration: "none" }}>{s.email}</a>
                    </td>
                    <td>
                      <span className={`badge ${s.type === "drop" ? "info" : "attention"}`}>
                        {s.type === "drop" ? "Nieuwe drops" : `Maat ${s.size ?? ""} terug`}
                      </span>
                    </td>
                    <td className="admin-hide-mobile">{fmt(s.createdAt)}</td>
                    <td className="num">
                      <form action={deleteSubscriberAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="admin-link" aria-label={`Verwijder ${s.email}`}>Verwijderen</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            {firebaseConfigured()
              ? "Nog geen inschrijvingen. Ze verschijnen hier zodra iemand zich inschrijft op de site."
              : "Koppel Firebase om inschrijvingen op te slaan."}
          </p>
        )}
      </section>
    </>
  );
}
