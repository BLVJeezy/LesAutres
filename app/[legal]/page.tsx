import Link from "next/link";
import { notFound } from "next/navigation";
const content: Record<
  string,
  { title: string; sections: { title: string; text: string }[] }
> = {
  privacy: {
    title: "Privacyverklaring",
    sections: [
      {
        title: "Wat we bewaren",
        text: "Deze preview bewaart je winkelmand en cookiekeuze lokaal in je browser. Inschrijfformulieren zijn nog niet aangesloten; ingevoerde e-mailadressen worden niet opgeslagen.",
      },
      {
        title: "E-mailupdates",
        text: "Bij lancering wordt inschrijven alleen actief met expliciete toestemming en dubbele opt-in. Je bevestigt dan je e-mailadres via een link en kunt je op elk moment uitschrijven.",
      },
      {
        title: "Cookies & analytics",
        text: "De winkelmand gebruikt noodzakelijke lokale opslag. Analytics-events worden alleen na toestemming geactiveerd. Er is nog geen externe analytics-provider aangesloten. Via Cookies onderaan de homepage kun je je keuze aanpassen.",
      },
      {
        title: "Jouw gegevens",
        text: "Vóór lancering voegen we de verantwoordelijke onderneming, contactgegevens, verwerkers, bewaartermijnen en de procedure voor inzage, correctie en verwijdering toe.",
      },
    ],
  },
  voorwaarden: {
    title: "Algemene voorwaarden",
    sections: [
      {
        title: "Status van de shop",
        text: "Dit is een niet-transactionele preview. Prijzen en voorraad zijn voorbeeldgegevens. Er kunnen geen bestellingen of betalingen worden afgerond.",
      },
      {
        title: "Bestellen & betalen",
        text: "Bij lancering worden totaalprijs, belastingen, verzendkosten en levertermijn vóór betaling getoond. De betaalprovider wordt voorbereid voor Bancontact, kaarten, Apple Pay en Google Pay; beschikbaarheid is afhankelijk van de uiteindelijke aansluiting.",
      },
      {
        title: "Pre-orders",
        text: "Een pre-order wordt afzonderlijk aangeduid in de productkeuze en winkelmand. De verwachte verzenddatum moet vóór betaling vaststaan en in de orderbevestiging worden herhaald.",
      },
      {
        title: "Ondernemingsgegevens",
        text: "Handelsnaam, vestigingsadres, contactadres en ondernemings-/BTW-nummer moeten nog door Les Autres worden aangeleverd.",
      },
    ],
  },
  retour: {
    title: "Retour & herroeping",
    sections: [
      {
        title: "14 dagen bedenktijd",
        text: "Je kunt je aankoop binnen 14 dagen na ontvangst herroepen. Na je melding heb je nog 14 dagen om het artikel terug te sturen.",
      },
      {
        title: "Zo meld je een retour",
        text: "Het contactadres, retouradres en modelformulier voor herroeping worden vóór opening van de shop toegevoegd. Bewaar het artikel zorgvuldig; passen mag zoals in een fysieke winkel.",
      },
      {
        title: "Terugbetaling",
        text: "De definitieve retourprocedure zal uitleggen hoe aankoopbedrag en standaard heenzendkosten worden terugbetaald en wie de retourkosten draagt. Terugbetaling kan worden opgeschort tot het artikel of verzendbewijs is ontvangen.",
      },
    ],
  },
  verzending: {
    title: "Verzendinformatie",
    sections: [
      {
        title: "Vanuit België",
        text: "Les Autres verzendt vanuit België. Beschikbare landen, vervoerder, verzendkosten en levertijden worden vóór de lancering bevestigd en vóór betaling getoond.",
      },
      {
        title: "Op voorraad of pre-order",
        text: "Voorraadartikelen en pre-orders kunnen per maat verschillen. Bij pre-orders zie je de verwachte verzenddatum bij het product, in je winkelmand en later in de bevestigingsmail.",
      },
      {
        title: "Gemengde bestellingen",
        text: "Of voorraadartikelen en pre-orders samen of apart worden verstuurd, wordt vóór betaling duidelijk gemaakt. Er worden nu nog geen orders aangenomen.",
      },
    ],
  },
};
export function generateStaticParams() {
  return Object.keys(content).map((legal) => ({ legal }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  return {
    title: `${content[legal]?.title || "Niet gevonden"} — Les Autres`,
    alternates: { canonical: `/${legal}` },
  };
}
export default async function Legal({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  const page = content[legal];
  if (!page) notFound();
  return (
    <main className="legal">
      <Link href="/">← LES AUTRES</Link>
      <h1>{page.title}</h1>
      <p className="legal-notice">
        Concept voor de preview. Aan te vullen met bedrijfsgegevens en
        definitieve verkoopvoorwaarden vóór de lancering.
      </p>
      {page.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
    </main>
  );
}
