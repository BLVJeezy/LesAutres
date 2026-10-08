/**
 * Legal identity and shop policy used by the legal pages, checkout and e-mails.
 * Fill in every empty value before launch; pages show a notice while something is missing.
 */
export const company = {
  brand: "Les Autres",
  /** Official name of the selling company, e.g. "Les Autres BV" or your own name for a sole trader. */
  legalName: "Solyn Global",
  /** e.g. "BV", "eenmanszaak", "Ltd". */
  legalForm: "Ltd",
  /** Registered office: street + number, postcode, city, country. */
  address: "",
  /** UK company number (Companies House), e.g. "12345678". */
  enterpriseNumber: "",
  /** VAT number; leave empty while not VAT-registered. */
  vatNumber: "",
  /** Customer service address, shown everywhere and used for withdrawals. */
  email: "support@lesautresbe.com",
  phone: "",
  /** Where returns must be sent; defaults to the registered office. */
  returnAddress: "",
  /** Company that collects card payments on behalf of the seller (name shown on the Revolut payment page). */
  paymentCollector: "Solyn Global Ltd (Londen, Verenigd Koninkrijk)",
  /** Shop policy. */
  countries: ["België", "Nederland", "Luxemburg", "Frankrijk", "Duitsland", "Spanje"],
  shippingCost: "altijd gratis met bpost, GLS of UPS; persoonlijke levering door Issa zelf kost € 10.000",
  dispatchTime: "binnen 48 uur na je betaling",
  deliveryTime: "meestal 1 tot 3 werkdagen in België en 2 tot 6 werkdagen in de andere landen",
  carrier: "bpost, GLS of UPS (naar keuze), of persoonlijk door Issa zelf",
  updated: "27 september 2026",
};

export const missingCompanyInfo = () =>
  (["legalName", "legalForm", "address", "enterpriseNumber", "email"] as const).filter(
    (k) => !company[k],
  );

export const returnAddress = () => company.returnAddress || company.address;
export const fill = (v: string, label: string) => v || `[${label} — nog in te vullen]`;
