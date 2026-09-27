import Link from "next/link";
import { notFound } from "next/navigation";
import { missingCompanyInfo } from "@/lib/company";
import { legalPages } from "@/lib/legal";

export function generateStaticParams() {
  return Object.keys(legalPages).map((legal) => ({ legal }));
}

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  return {
    title: `${legalPages[legal]?.title || "Niet gevonden"} — Les Autres`,
    alternates: { canonical: `/${legal}` },
  };
}

export default async function Legal({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  const page = legalPages[legal];
  if (!page) notFound();
  return (
    <main className="legal">
      <Link href="/">← LES AUTRES</Link>
      <h1>{page.title}</h1>
      {missingCompanyInfo().length > 0 && (
        <p className="legal-notice">Enkele bedrijfsgegevens worden nog aangevuld.</p>
      )}
      {page.intro}
      {page.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.body}
        </section>
      ))}
      <nav className="legal-nav" aria-label="Juridische pagina's">
        <Link href="/voorwaarden">Voorwaarden</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookies">Cookies</Link>
        <Link href="/retour">Retour</Link>
        <Link href="/verzending">Verzending</Link>
        <Link href="/herroepen">Herroepen</Link>
      </nav>
    </main>
  );
}
