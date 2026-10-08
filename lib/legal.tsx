import Link from "next/link";
import type { ReactNode } from "react";
import { company as c, fill, returnAddress } from "./company";

type Page = { title: string; intro?: ReactNode; sections: { title: string; body: ReactNode }[] };

const name = () => fill(c.legalName && `${c.legalName}${c.legalForm ? ` (${c.legalForm})` : ""}`, "bedrijfsnaam");
const email = () =>
  c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : fill("", "e-mailadres");

const Identity = () => (
  <ul>
    <li>Handelsnaam: {c.brand}</li>
    <li>Verkoper: {name()}, een vennootschap naar Engels recht</li>
    <li>Statutaire zetel: {fill(c.address, "adres")}</li>
    <li>Bedrijfsnummer (Companies House): {fill(c.enterpriseNumber, "bedrijfsnummer")}</li>
    {c.vatNumber && <li>Btw-nummer: {c.vatNumber}</li>}
    <li>Klantenservice: {email()} — we antwoorden zo snel mogelijk, op werkdagen</li>
    {c.phone && <li>Telefoon: {c.phone}</li>}
  </ul>
);

export const legalPages: Record<string, Page> = {
  voorwaarden: {
    title: "Algemene voorwaarden",
    intro: <p>Deze voorwaarden gelden voor elke bestelling op deze website. Lees ze even voor je bestelt.</p>,
    sections: [
      { title: "1. Wie zijn wij", body: <><p>De webshop Les Autres wordt uitgebaat door:</p><Identity /></> },
      {
        title: "2. Toepassing",
        body: (
          <p>
            Deze voorwaarden zijn van toepassing op alle aanbiedingen en verkopen via deze website aan consumenten.
            Door een bestelling te plaatsen en te betalen, aanvaard je deze voorwaarden. Dwingende rechten die je als
            consument hebt, blijven altijd gelden.
          </p>
        ),
      },
      {
        title: "3. Aanbod en prijzen",
        body: (
          <p>
            Alle prijzen zijn in euro en zijn eindprijzen: er komen geen kosten bij. We verzenden naar {c.countries.join(", ")}.
            Verzending is {c.shippingCost}. Je ziet de verzendkosten en het totaal altijd vóór je betaalt. Foto&apos;s geven het product zo getrouw mogelijk weer; kleine verschillen in
            kleur door schermen zijn mogelijk. Een aanbod geldt zolang de voorraad strekt. Drop 001 is beperkt tot 30 tees; artikelen in je winkelmand worden 10 minuten voor je gereserveerd. Bundels: 2 tees voor € 79,95, vanaf 3 tees € 36,65 per stuk. Een kennelijke
            vergissing in een prijs of productomschrijving bindt ons niet; in dat geval nemen we contact met je op
            en kun je de bestelling kosteloos annuleren.
          </p>
        ),
      },
      {
        title: "4. Bestellen",
        body: (
          <p>
            Je kiest je artikelen en maat, vult je gegevens in en klikt op &ldquo;Betalen&rdquo;. Die knop
            betekent dat je een bestelling plaatst met betalingsverplichting. De overeenkomst komt tot stand zodra je
            betaling is gelukt. Je krijgt daarna een bevestigingsmail met alle details van je bestelling. Controleer
            die goed en laat het ons meteen weten als er iets niet klopt.
          </p>
        ),
      },
      {
        title: "5. Betalen",
        body: (
          <p>
            Je betaalt vooraf en veilig via Revolut (Revolut Pay, Visa, Mastercard, American Express, Apple Pay of
            Google Pay). De betaling wordt geïnd door {name()}, de uitbater van {c.brand}; daarom zie je die naam
            op de betaalpagina en op je rekeningafschrift. Je koopovereenkomst sluit je met {name()}. Wij ontvangen
            of bewaren nooit je kaartgegevens. Is de betaling niet gelukt, dan is er geen bestelling.
          </p>
        ),
      },
      {
        title: "6. Levering",
        body: (
          <p>
            We verzenden {c.dispatchTime} met {c.carrier}. De levertijd is daarna {c.deliveryTime}. Zodra je pakket
            vertrekt, krijg je een trackinglink. We leveren in elk geval binnen 30 dagen na je bestelling; lukt dat
            niet, dan laten we het je weten en kun je de bestelling kosteloos ontbinden en krijg je je geld meteen
            terug. Het risico op verlies of beschadiging gaat pas op jou over wanneer jij (of iemand die jij aanwijst)
            het pakket ontvangt. Meer info op <Link href="/verzending">Verzending</Link>.
          </p>
        ),
      },
      {
        title: "7. Herroepingsrecht (14 dagen)",
        body: (
          <p>
            Je hebt 14 dagen na ontvangst om zonder opgave van reden af te zien van je aankoop. Hoe dat werkt, lees je
            op <Link href="/retour">Retour &amp; herroeping</Link>. Je kunt ook meteen online herroepen via{" "}
            <Link href="/herroepen">Herroep de overeenkomst hier</Link>.
          </p>
        ),
      },
      {
        title: "8. Wettelijke garantie",
        body: (
          <p>
            Op al onze producten heb je de wettelijke garantie van 2 jaar vanaf levering voor gebreken die bij levering
            bestonden (conformiteitsgebreken). Meld een gebrek zo snel mogelijk en uiterlijk binnen 2 maanden nadat je
            het ontdekt hebt via {email()}. We herstellen of vervangen het artikel kosteloos, of je krijgt een
            prijsvermindering of terugbetaling als dat niet mogelijk is. Normale slijtage, verkeerd wassen (zie het
            wasetiket) of beschadiging door gebruik vallen niet onder de garantie.
          </p>
        ),
      },
      {
        title: "9. Aansprakelijkheid",
        body: (
          <p>
            We zijn niet aansprakelijk voor schade door overmacht of door gebruik van het product dat niet
            overeenstemt met de bestemming of het wasvoorschrift. Deze beperking geldt niet voor opzet, zware fout of
            aansprakelijkheid die de wet niet laat uitsluiten.
          </p>
        ),
      },
      {
        title: "10. Intellectuele eigendom",
        body: (
          <p>
            Alle ontwerpen, prints, foto&apos;s, video&apos;s, teksten en het logo van Les Autres zijn beschermd. Je mag
            ze niet kopiëren of commercieel gebruiken zonder onze schriftelijke toestemming.
          </p>
        ),
      },
      {
        title: "11. Privacy",
        body: (
          <p>
            We gebruiken je gegevens alleen om je bestelling af te handelen en zoals beschreven in onze{" "}
            <Link href="/privacy">privacyverklaring</Link>.
          </p>
        ),
      },
      {
        title: "12. Klachten en geschillen",
        body: (
          <>
            <p>
              Heb je een klacht? Mail naar {email()}; we antwoorden binnen 5 werkdagen. Komen we er samen niet uit, dan
              kun je gratis terecht bij de Consumentenombudsdienst (
              <a href="https://consumentenombudsdienst.be" target="_blank" rel="noopener noreferrer">
                consumentenombudsdienst.be
              </a>
              ).
            </p>
            <p>
              Op deze voorwaarden is het Belgisch recht van toepassing. Woon je in een ander EU-land, dan behoud je de
              bescherming van de dwingende regels van je eigen land. Geschillen gaan naar de bevoegde rechtbank volgens
              de wet; als consument kun je altijd ook naar de rechter van je woonplaats.
            </p>
          </>
        ),
      },
      {
        title: "13. Wijzigingen",
        body: (
          <p>
            We kunnen deze voorwaarden aanpassen. Voor jouw bestelling gelden altijd de voorwaarden zoals ze op het
            moment van je bestelling op de website stonden. Laatst bijgewerkt: {c.updated}.
          </p>
        ),
      },
    ],
  },

  privacy: {
    title: "Privacyverklaring",
    intro: (
      <p>
        We gaan zorgvuldig om met je gegevens en verzamelen niet meer dan nodig. Hier lees je wat we bewaren, waarom
        en wat je rechten zijn, volgens de Algemene Verordening Gegevensbescherming (AVG/GDPR).
      </p>
    ),
    sections: [
      {
        title: "1. Verantwoordelijke",
        body: <><p>Verantwoordelijk voor je gegevens is:</p><Identity /><p>Voor alle privacyvragen: {email()}.</p></>,
      },
      {
        title: "2. Welke gegevens en waarom",
        body: (
          <ul>
            <li>
              <b>Bestellingen</b>: naam, e-mailadres, telefoonnummer (optioneel), verzendadres, bestelde artikelen,
              bedrag en betaalstatus. Nodig om je bestelling te leveren, je te informeren en voor garantie of retour
              (uitvoering van de overeenkomst). We bewaren ze ook voor onze boekhouding (wettelijke
              verplichting). Rond je de betaling niet af, dan sturen we je eenmalig een herinnering per e-mail
              (gerechtvaardigd belang). Wanneer je pakket vertrekt, mailen we je de trackinglink.
            </li>
            <li>
              <b>Betaling</b>: je kaart- of rekeninggegevens gaan rechtstreeks naar Revolut. Wij zien die nooit; we
              krijgen alleen te horen of de betaling gelukt is.
            </li>
            <li>
              <b>Nieuwe drops of maat terug</b>: je e-mailadres en je keuze (bv. maat), alleen met je uitdrukkelijke
              toestemming. Je kunt die altijd intrekken.
            </li>
            <li>
              <b>Herroepingen en klantvragen</b>: de gegevens die je ons stuurt, om je verzoek af te handelen.
            </li>
            <li>
              <b>Technische gegevens</b>: onze hostingpartner verwerkt kort je IP-adres en browsergegevens in logbestanden
              om de website veilig en werkend te houden (gerechtvaardigd belang).
            </li>
          </ul>
        ),
      },
      {
        title: "3. Hoe lang",
        body: (
          <ul>
            <li>Bestel- en factuurgegevens: zo lang als de boekhoudkundige en fiscale wetgeving voorschrijft (in België momenteel 10 jaar).</li>
            <li>Inschrijvingen voor updates: tot je je uitschrijft of je toestemming intrekt.</li>
            <li>Herroepingen en klantvragen: tot 2 jaar na afhandeling, of langer als dat nodig is voor een geschil.</li>
            <li>Technische logbestanden: enkele dagen tot weken.</li>
          </ul>
        ),
      },
      {
        title: "4. Met wie we gegevens delen",
        body: (
          <>
            <p>We verkopen je gegevens nooit. We werken alleen met deze partners, die ze voor ons verwerken:</p>
            <ul>
              <li><b>Revolut</b>: betalingen (voor de betaling zelf is Revolut ook zelf verantwoordelijk).</li>
              <li><b>Google Firebase</b> (Google Cloud, servers in de EU): opslag van bestellingen, producten en inschrijvingen.</li>
              <li><b>Vercel</b>: hosting van de website.</li>
              <li><b>Resend</b>: versturen van bestel- en servicemails.</li>
              <li><b>De vervoerder</b> ({c.carrier}): naam, adres en eventueel telefoonnummer om je pakket te leveren.</li>
            </ul>
            <p>
              Sommige partners zijn gevestigd in de Verenigde Staten. Doorgifte gebeurt dan op basis van het EU-VS Data
              Privacy Framework of de standaardcontractbepalingen van de Europese Commissie.
            </p>
          </>
        ),
      },
      {
        title: "5. Cookies en lokale opslag",
        body: (
          <p>
            We gebruiken geen tracking- of advertentiecookies. Wat we wel lokaal bewaren, lees je in ons{" "}
            <Link href="/cookies">cookiebeleid</Link>.
          </p>
        ),
      },
      {
        title: "6. Je rechten",
        body: (
          <>
            <p>
              Je hebt het recht op inzage, verbetering, wissing, beperking van de verwerking, overdraagbaarheid van je
              gegevens en om bezwaar te maken. Toestemming kun je altijd intrekken. Stuur je verzoek naar {email()};
              we antwoorden binnen een maand.
            </p>
            <p>
              Ben je niet tevreden, dan kun je klacht indienen bij de Gegevensbeschermingsautoriteit, Drukpersstraat
              35, 1000 Brussel (
              <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer">
                gegevensbeschermingsautoriteit.be
              </a>
              ).
            </p>
          </>
        ),
      },
      {
        title: "7. Beveiliging",
        body: (
          <p>
            De website werkt alleen via een beveiligde verbinding (https). Toegang tot bestellingen is beperkt tot
            wie ze nodig heeft en beschermd met een wachtwoord.
          </p>
        ),
      },
      { title: "8. Wijzigingen", body: <p>We passen deze verklaring aan als dat nodig is. Laatst bijgewerkt: {c.updated}.</p> },
    ],
  },

  cookies: {
    title: "Cookiebeleid",
    intro: (
      <p>
        Kort: we volgen je niet. Deze website plaatst geen advertentie- of trackingcookies en gebruikt geen externe
        analytics. We bewaren alleen wat nodig is om de shop te laten werken.
      </p>
    ),
    sections: [
      {
        title: "Wat we bewaren op je toestel",
        body: (
          <ul>
            <li><b>la-cart</b> (lokale opslag, noodzakelijk): je winkelmand, zodat die niet verdwijnt. Blijft tot je bestelt of hem leegmaakt.</li>
            <li><b>la-consent</b> (lokale opslag, noodzakelijk): je keuze in de cookiemelding.</li>
            <li><b>la-cart-id</b> (lokale opslag, noodzakelijk): een willekeurige code voor je winkelmand, zodat je tees 10 minuten voor jou gereserveerd blijven.</li>
            <li><b>la-lang</b> (lokale opslag en cookie, noodzakelijk): de taal die je koos, zodat de shop in jouw taal blijft.</li>
            <li><b>la_admin</b> (cookie, noodzakelijk): alleen voor beheerders die inloggen op het beheer van de shop; vervalt na 12 uur.</li>
          </ul>
        ),
      },
      {
        title: "Betalen",
        body: (
          <p>
            Wanneer je afrekent, ga je naar de betaalpagina van Revolut. Revolut kan daar eigen noodzakelijke cookies
            gebruiken voor een veilige betaling en fraudepreventie; daarvoor geldt het cookiebeleid van Revolut.
          </p>
        ),
      },
      {
        title: "Analytics",
        body: (
          <p>
            Alleen als je in de cookiemelding op &ldquo;Accepteren&rdquo; klikt, tellen we anoniem hoeveel bezoekers de shop
            bekijken, iets in hun winkelmand leggen en naar de checkout gaan. We plaatsen daarvoor geen cookies en
            bewaren geen IP-adres of andere persoonsgegevens: we verhogen alleen een teller per dag. Kies je
            &ldquo;Alleen noodzakelijk&rdquo;, dan wordt er niets geteld.
          </p>
        ),
      },
      {
        title: "Je keuze aanpassen",
        body: (
          <p>
            Klik onderaan de homepage op &ldquo;Cookies&rdquo; om je keuze te wijzigen. Je kunt lokale opslag ook altijd
            wissen via de instellingen van je browser. Laatst bijgewerkt: {c.updated}.
          </p>
        ),
      },
    ],
  },

  retour: {
    title: "Retour & herroeping",
    intro: (
      <p>
        Past het niet of spreekt het je toch niet aan? Je hebt 14 dagen bedenktijd. Online herroepen kan meteen via{" "}
        <Link href="/herroepen">Herroep de overeenkomst hier</Link>.
      </p>
    ),
    sections: [
      {
        title: "In het kort",
        body: (
          <ol>
            <li>Meld binnen 14 dagen na ontvangst dat je wilt herroepen: online via <Link href="/herroepen">dit formulier</Link> of per e-mail naar {email()}.</li>
            <li>Stuur het artikel ongedragen, ongewassen en met labels binnen 14 dagen terug naar het adres hieronder. De retourkosten zijn voor jou.</li>
            <li>Je krijgt je geld binnen 14 dagen terug op hetzelfde betaalmiddel, zodra we het artikel (of je verzendbewijs) hebben.</li>
          </ol>
        ),
      },
      {
        title: "Herroepingsrecht",
        body: (
          <p>
            Je hebt het recht om binnen 14 dagen zonder opgave van reden de overeenkomst te herroepen. Die termijn
            loopt tot 14 dagen na de dag waarop jij (of iemand die je aanwijst, niet de vervoerder) het artikel
            ontvangt. Bestel je meerdere artikelen die apart geleverd worden, dan telt de ontvangst van het laatste
            artikel.
          </p>
        ),
      },
      {
        title: "Zo herroep je",
        body: (
          <>
            <p>Laat ons vóór het einde van de termijn duidelijk weten dat je wilt herroepen. Dat kan op drie manieren:</p>
            <ul>
              <li>online via <Link href="/herroepen">Herroep de overeenkomst hier</Link> (je krijgt meteen een ontvangstbevestiging per e-mail);</li>
              <li>per e-mail naar {email()};</li>
              <li>met het modelformulier hieronder (niet verplicht).</li>
            </ul>
          </>
        ),
      },
      {
        title: "Terugsturen",
        body: (
          <p>
            Stuur het artikel zonder onnodige vertraging en uiterlijk binnen 14 dagen na je herroeping terug naar:{" "}
            <b>{fill(returnAddress(), "retouradres")}</b>. De kosten voor het terugsturen zijn voor jou. Stuur het
            artikel goed verpakt terug en bewaar je verzendbewijs.
          </p>
        ),
      },
      {
        title: "Staat van het artikel",
        body: (
          <p>
            Je mag het artikel passen zoals in een winkel. Draag het niet langer dan nodig om te beslissen, was het
            niet en laat de labels eraan. Is het artikel in waarde verminderd door meer gebruik dan nodig om het te
            beoordelen, dan mogen we die waardevermindering aanrekenen.
          </p>
        ),
      },
      {
        title: "Terugbetaling",
        body: (
          <p>
            We betalen het volledige bedrag terug, inclusief de oorspronkelijke verzendkosten (tot het bedrag van onze goedkoopste standaardlevering; de meerprijs voor levering door Issa betalen we niet terug), binnen 14 dagen nadat
            we je herroeping ontvangen. We gebruiken hetzelfde betaalmiddel als waarmee je betaalde, tenzij je
            uitdrukkelijk iets anders vraagt; dat kost je niets. We mogen wachten met terugbetalen tot we het artikel
            terug hebben of tot je aantoont dat je het hebt teruggestuurd.
          </p>
        ),
      },
      {
        title: "Ruilen",
        body: (
          <p>
            Wil je een andere maat? Herroep de aankoop en plaats een nieuwe bestelling, zodat je zeker bent dat je
            maat nog beschikbaar is.
          </p>
        ),
      },
      {
        title: "Kapot of verkeerd geleverd?",
        body: (
          <p>
            Dat valt niet onder de herroeping maar onder de wettelijke garantie. Mail ons met een foto naar {email()};
            wij regelen en betalen de retour en sturen een nieuw artikel of betalen je terug.
          </p>
        ),
      },
      {
        title: "Modelformulier voor herroeping",
        body: (
          <div className="legal-form">
            <p>(Vul dit formulier alleen in en stuur het terug als je de overeenkomst wilt herroepen.)</p>
            <p>
              — Aan: {name()}, {fill(c.address, "adres")}, {c.email || fill("", "e-mailadres")}
            </p>
            <p>
              — Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de verkoop van de
              volgende goederen herroep/herroepen (*):
            </p>
            <p>— Besteld op (*) / Ontvangen op (*):</p>
            <p>— Naam/Namen consument(en):</p>
            <p>— Adres consument(en):</p>
            <p>— Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend):</p>
            <p>— Datum:</p>
            <p>(*) Doorhalen wat niet van toepassing is.</p>
          </div>
        ),
      },
    ],
  },

  verzending: {
    title: "Verzending",
    sections: [
      {
        title: "Waar en wat het kost",
        body: <p>We verzenden vanuit België naar {c.countries.join(", ")}. Verzending is {c.shippingCost}.</p>,
      },
      {
        title: "Wanneer",
        body: (
          <p>
            We verzenden {c.dispatchTime} met {c.carrier}. Daarna duurt de levering {c.deliveryTime}. Bestellingen
            worden uiterlijk binnen 30 dagen geleverd.
          </p>
        ),
      },
      {
        title: "Volgen",
        body: <p>Zodra je pakket vertrekt, krijg je een e-mail met een trackinglink.</p>,
      },
      {
        title: "Niet thuis of beschadigd",
        body: (
          <p>
            Ben je niet thuis, dan volgt de vervoerder zijn gewone procedure (nieuwe poging, afhaalpunt of bericht).
            Komt je pakket beschadigd aan of ontbreekt er iets, mail ons dan binnen enkele dagen met een foto naar{" "}
            {email()}. Het risico ligt bij ons tot je het pakket ontvangt.
          </p>
        ),
      },
    ],
  },
};
