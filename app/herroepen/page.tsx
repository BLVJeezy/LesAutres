import Link from "next/link";
import { company } from "@/lib/company";
import { WithdrawForm } from "./withdraw-form";

export const metadata = { title: "Herroep de overeenkomst — Les Autres", alternates: { canonical: "/herroepen" } };

export default function Herroepen() {
  return (
    <main className="legal">
      <Link href="/">← LES AUTRES</Link>
      <h1>Herroep de overeenkomst hier</h1>
      <p>
        Je hebt 14 dagen na ontvangst om zonder reden af te zien van je aankoop. Vul hieronder je gegevens in en klik
        op &ldquo;Herroeping bevestigen&rdquo;. Je krijgt meteen een ontvangstbevestiging per e-mail met datum en
        uur. Daarna stuur je het artikel binnen 14 dagen terug; lees hoe op{" "}
        <Link href="/retour">Retour &amp; herroeping</Link>.
      </p>
      {company.email && (
        <p>
          Liever per mail? Stuur je herroeping naar <a href={`mailto:${company.email}`}>{company.email}</a>.
        </p>
      )}
      <WithdrawForm />
    </main>
  );
}
