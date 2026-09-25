# Les Autres — Drop 001

A mobile-first Next.js shop preview for Les Autres. React 19, TypeScript, Tailwind 4, React Three Fiber/drei and Framer Motion.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build && npm start`. Deploy with the standard Next.js preset on Vercel. No external credentials are required for the preview.

## Included

- Extruded, independently animated 3D hero letters; locally hosted font.
- Real 136 KB GLB shirt with front/back print, matte cloth, six colorways, horizontal drag with damping, keyboard rotation, delayed auto-rotation and no pinch zoom. Vertical touch scrolling remains native.
- Shared lighting setup; lazy scenes; reduced-motion support; error/GPU fallback illustrations.
- Responsive editorial image strip, selection, preview stock/preorder states, sold-out restock sheet, size guide, persistent cart, sticky purchase action, quantity/stock limits.
- Native modal dialogs with focus trapping/Escape, consent controls, newsletter and restock hooks, disclosure panels.
- Metadata, generated OG image and app icon, product structured data, robots/sitemap, legal concept pages.
- No payment or mailing is performed in this preview. API responses explicitly explain this rather than pretending success.

## Before launch

1. Approve prices, authoritative inventory and shipping dates in `lib/catalog.ts`; replace preview fixtures with server catalogue data and remove preview labeling only after verification.
2. Supply the final GLB/PBR garment asset and campaign photography. `public/shirt.glb` is a procedural prototype, not a photorealistic production garment. The alternate fallback is an SVG illustration. Camouflage currently uses a flat olive ink rather than an approved camo pattern. The type-based wordmark approximates the reference; replace with the original logo.
3. Provide production size measurements, legal entity/address/contact/VAT number, shipping costs/countries/terms, return address and withdrawal form. Legal pages are explicitly marked drafts and require approval.
4. Implement `/api/checkout` behind `onCheckout(cart)` in `lib/integrations.ts`. Re-read product prices/inventory server-side; never trust browser totals. Support Bancontact/cards/wallets. Confirm preorder dispatch dates before accepting checkout and repeat them in order confirmation. Implement verified, idempotent payment webhooks before emitting `purchase`.
5. Implement `/api/subscribe` behind `onSubscribe(email, context)`. Validate variant context, add rate limiting and provider double opt-in; persist consent and variant context only under the approved privacy policy. Send a pending-confirmation response only after the provider accepts the request. No provider is currently configured and no address is saved.
6. Set `NEXT_PUBLIC_SITE_URL` to the approved origin. Until then indexing is disabled. Product offer schema is deliberately omitted until genuine prices and availability are available; generate InStock/PreOrder/OutOfStock offers from the same authoritative catalogue at launch.
7. Attach analytics to `les-autres:analytics` only after consent. Never fire `purchase` from a client-side success click.
8. Validate LCP and sustained frame rate on physical mid-range mobile hardware over 4G. These performance targets have not been measured here.

## Assets

- Tech sheet: supplied by the user, retained in `public/images/tech-sheet.jpeg`.
- Lifestyle strip: temporary Unsplash mood photography (remote images), clearly labeled as mood imagery; replace with the actual campaign before launch.
- Procedural shirt regeneration: `node scripts/create-shirt.mjs` (Three.js GLTF exporter).
- Font: Three.js bundled Helvetiker typeface. See the upstream font license in the Three.js distribution.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Unit tests cover sold-out rejection, cart stock caps and mixed stock/preorder availability. Browser checks cover desktop/mobile rendering, size selection, cart, checkout preview response, restock form and cookie choices. Local preview forms must return 503 until providers are wired, by design.

Legal reference used for the draft: [EU consumer rights and distance selling](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm). Include the required online withdrawal function before transactional launch; see [European Commission online-shopping guidance](https://commission.europa.eu/digital-life/protecting-you-when-buying-online_en).
