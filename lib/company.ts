/**
 * Legal identity and shop policy used by the legal pages, checkout and e-mails.
 * Fill in every empty value before launch; pages show a notice while something is missing.
 */
export const company = {
  brand: "Les Autres",
  /** Official name of the selling company, e.g. "Les Autres BV" or your own name for a sole trader. */
  legalName: "",
  /** e.g. "BV", "eenmanszaak", "Ltd". */
  legalForm: "",
  /** Registered office: street + number, postcode, city, country. */
  address: "",
  /** Belgian enterprise number (KBO), e.g. "BE 0123.456.789". */
  enterpriseNumber: "",
  /** VAT number; usually the same as the enterprise number in Belgium. */
  vatNumber: "",
  /** Customer service address, shown everywhere and used for withdrawals. */
  email: "",
  phone: "",
  /** Where returns must be sent; defaults to the registered office. */
  returnAddress: "",
  /** Company that collects card payments on behalf of the seller (name shown on the Revolut payment page). */
  paymentCollector: "Solyn Global Ltd (Londen, Verenigd Koninkrijk)",
  /** Shop policy. */
  countries: ["België", "Nederland", "Luxemburg", "Frankrijk", "Duitsland", "Spanje"],
  shippingCost: "gratis",
  dispatchTime: "binnen 3 werkdagen na je betaling",
  deliveryTime: "meestal 1 tot 3 werkdagen in België en 2 tot 6 werkdagen in de andere landen",
  carrier: "bpost of een andere erkende vervoerder",
  updated: "27 september 2026",
};

export const missingCompanyInfo = () =>
  (["legalName", "legalForm", "address", "enterpriseNumber", "vatNumber", "email"] as const).filter(
    (k) => !company[k],
  );

export const returnAddress = () => company.returnAddress || company.address;
export const fill = (v: string, label: string) => v || `[${label} — nog in te vullen]`;
