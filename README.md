# Les Autres — Drop 001

A mobile-first Next.js shop preview for Les Autres. React 19, TypeScript, Tailwind 4, React Three Fiber/drei and Framer Motion.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build && npm start`. Deploy with the standard Next.js preset on Vercel. No external credentials are required for the preview.

## Included

- Stacked, italic chrome 3D wordmark with bevels, reflection lighting and gentle floating movement; locally hosted font and a matching rendered fallback.
- One approved off-white garment with pink/black print. The supplied product photograph is the default image, cart thumbnail and social-sharing image. No color selectors or unavailable variants.
- Optional 360° view: a draped GLB with fabric normal/AO textures, a print integrated into the cloth shader, horizontal drag, keyboard rotation, inertia and a 38-second full rotation. Vertical touch scrolling stays native.
- Lazy scenes and reduced-motion support. Sustained low frame rate reduces pixel density instead of disabling both scenes. The product photo remains available independently of WebGL.
- Responsive editorial image strip, selection, preview stock/preorder states, sold-out restock sheet, size guide, persistent cart, sticky purchase action, quantity/stock limits.
- Native modal dialogs with focus trapping/Escape, consent controls, newsletter and restock hooks, disclosure panels.
- Metadata, generated OG image and app icon, product structured data, robots/sitemap, legal concept pages.
- No payment or mailing is performed in this preview. API responses explicitly explain this rather than pretending success.

## Before launch

1. Approve prices, authoritative inventory and shipping dates in `lib/catalog.ts`; replace preview fixtures with server catalogue data and remove preview labeling only after verification.
2. Supply final campaign photography and validate the optional 3D garment against the production sample. The primary product photo is the exact user-approved image. The 3D mesh is an adapted draped garment, not a scan of the actual product. The type-based chrome wordmark approximates the reference; replace with original brand outlines if available.
3. Provide production size measurements, legal entity/address/contact/VAT number, shipping costs/countries/terms, return address and withdrawal form. Legal pages are explicitly marked drafts and require approval.
4. Implement `/api/checkout` behind `onCheckout(cart)` in `lib/integrations.ts`. Re-read product prices/inventory server-side; never trust browser totals. Support Bancontact/cards/wallets. Confirm preorder dispatch dates before accepting checkout and repeat them in order confirmation. Implement verified, idempotent payment webhooks before emitting `purchase`.
5. Implement `/api/subscribe` behind `onSubscribe(email, context)`. Validate variant context, add rate limiting and provider double opt-in; persist consent and variant context only under the approved privacy policy. Send a pending-confirmation response only after the provider accepts the request. No provider is currently configured and no address is saved.
6. Set `NEXT_PUBLIC_SITE_URL` to the approved origin. Until then indexing is disabled. Product offer schema is deliberately omitted until genuine prices and availability are available; generate InStock/PreOrder/OutOfStock offers from the same authoritative catalogue at launch.
7. Attach analytics to `les-autres:analytics` only after consent. Never fire `purchase` from a client-side success click.
8. Validate LCP and sustained frame rate on physical mid-range mobile hardware over 4G. These performance targets have not been measured here.

## Assets

- Tech sheet: supplied by the user, retained in `public/images/tech-sheet.jpeg`.
- Lifestyle strip: temporary Unsplash mood photography (remote images), clearly labeled as mood imagery; replace with the actual campaign before launch.
- Approved product photo: `public/images/drop-001-product.jpeg`, copied without modification from the user’s supplied JPEG.
- Draped garment: [Poimandres T-shirt configurator](https://github.com/pmndrs/examples/tree/main/examples/t-shirt-configurator), adapted proportions, MIT license retained in `public/licenses/pmndrs-examples.txt`. Regenerate with `node scripts/prepare-garment.mjs`.
- Print font: Anton, SIL OFL license retained in `public/licenses/anton-OFL.txt`.
- Chrome hero fallback: captured from the live 3D scene, `public/renders/hero.png`.
- Font: Three.js bundled Helvetiker typeface. See the upstream font license in the Three.js distribution.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Unit tests cover sold-out rejection, removed-variant rejection, cart stock caps, mixed stock/preorder availability and the preserved color-turn animation helpers (currently unused by the single-variant UI). Browser checks cover desktop/mobile rendering, size selection, cart, checkout preview response, restock form and cookie choices. Local preview forms must return 503 until providers are wired, by design.

Legal reference used for the draft: [EU consumer rights and distance selling](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm). Include the required online withdrawal function before transactional launch; see [European Commission online-shopping guidance](https://commission.europa.eu/digital-life/protecting-you-when-buying-online_en).
