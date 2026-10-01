"use client";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Globe,
  Truck,
  RotateCcw,
  Lock,
  Check,
} from "lucide-react";
import {
  colors,
  sizes,
  money,
  addItem,
  type Size,
  type CartItem,
  type ShopProduct,
} from "@/lib/catalog";
import { company } from "@/lib/company";
import { FREE_FROM, SHIPPING_OPTIONS, shippingFee, type ShippingId } from "@/lib/shipping";
import { EMPTY_CUSTOMER, onSubscribe, onCheckout, trackEvent, type Customer } from "@/lib/integrations";
import { ShirtFallback } from "./shirt-fallback";
import { ShotCarousel } from "./shot-carousel";
import { AnthemVideo } from "./anthem-video";
function Wordmark() {
  return (
    <span className="wordmark">
      Les
      <br />
      <span>Autres</span>
    </span>
  );
}
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    const active = document.activeElement as HTMLElement;
    node?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-head">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Sluiten" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Subscribe({ size, color }: { size?: Size; color?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("");
        try {
          await onSubscribe(email, {
            type: size ? "restock" : "drop",
            size,
            color,
          });
          setStatus(
            size
              ? "Je staat op de lijst. We laten het je weten zodra je maat terug is."
              : "Je staat op de lijst. Je hoort het als eerste bij een nieuwe drop.",
          );
          setEmail("");
        } catch (error) {
          setStatus((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="email-field">
        <input
          aria-label="E-mailadres"
          type="email"
          placeholder="Jouw e-mailadres"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button aria-label="Inschrijven" disabled={busy}>
          {busy ? "…" : <ArrowRight size={23} />}
        </button>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Ja, stuur me updates over {size ? "deze maat" : "nieuwe drops"}. Ik ga
          akkoord met de <Link href="/privacy">privacyverklaring</Link>.
        </span>
      </label>
      <p className="form-status" role="status">
        {status}
      </p>
    </form>
  );
}
const photos = [
  {
    src: "/images/perspective-street.jpg",
    alt: "Man in de Baddies Tee tegen een roestige stalen pilaar op een bouwwerf",
  },
  {
    src: "/images/perspective-labels.jpg",
    alt: "Les Autres-nekbedrukking in witte Baddies Tees, 100% katoen",
  },
  {
    src: "/images/perspective-print.jpg",
    alt: "Close-up van de BADDIES IN BELGICA print",
  },
];
const COUNTRIES: [string, string][] = [
  ["BE", "België"],
  ["NL", "Nederland"],
  ["LU", "Luxemburg"],
  ["FR", "Frankrijk"],
  ["DE", "Duitsland"],
  ["ES", "Spanje"],
];

const SIZE_ROWS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const PRODUCT_CM: Record<string, (string | number)[]> = {
  "Lengte achterkant": [60, 63, 66, 69, 71, 71.5],
  "Schouderbreedte": [52, 53.5, 55, 57, 59, 61],
  "Lichaamsbreedte": [53.5, 56.5, 59.5, 63.5, 67.5, 70.5],
  "Mouwlengte (middenachter)": [46, 48, 50, 52, 53, 54],
};
const PRODUCT_IN: Record<string, string[]> = {
  "Lengte achterkant": ["23 1/2", "24 3/4", "26", "27 1/4", "28", "28 1/4"],
  "Schouderbreedte": ["20 1/2", "21", "21 3/4", "22 1/2", "23 1/4", "24"],
  "Lichaamsbreedte": ["21", "22 1/4", "23 1/2", "25", "26 1/2", "27 3/4"],
  "Mouwlengte (middenachter)": ["18", "19", "19 3/4", "20 1/2", "20 3/4", "21 1/4"],
};
const BODY_CM: Record<string, string[]> = {
  Borst: ["80–88", "88–96", "96–104", "104–112", "112–120", "120–128"],
  Taille: ["66–72", "68–76", "76–84", "84–92", "92–100", "100–108"],
};
const BODY_IN: Record<string, string[]> = {
  Borst: ["31 1/2–34 3/4", "34 3/4–37 3/4", "37 3/4–41", "41–44", "44–47 1/4", "47 1/4–50 1/2"],
  Taille: ["26–28 1/4", "26 3/4–30", "30–33", "33–36 1/4", "36 1/4–39 1/4", "39 1/4–42 1/2"],
};

function SizeGuide() {
  const [tab, setTab] = useState<"product" | "body">("product");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const data = tab === "product" ? (unit === "cm" ? PRODUCT_CM : PRODUCT_IN) : unit === "cm" ? BODY_CM : BODY_IN;
  const cols = Object.keys(data);
  return (
    <div className="size-table">
      <div className="size-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "product"} onClick={() => setTab("product")}>
          Productafmetingen
        </button>
        <button role="tab" aria-selected={tab === "body"} onClick={() => setTab("body")}>
          Lichaamsafmetingen
        </button>
      </div>
      <div className="size-units">
        {(["cm", "in"] as const).map((u) => (
          <label key={u}>
            <input type="radio" name="size-unit" checked={unit === u} onChange={() => setUnit(u)} />
            {u}
          </label>
        ))}
      </div>
      <div className="size-scroll">
        <table>
          <thead>
            <tr>
              <th>Maat</th>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((size, i) => (
              <tr key={size}>
                <th>{size}</th>
                {cols.map((c) => (
                  <td key={c}>{data[c][i]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny">
        {tab === "product"
          ? "Afmetingen van het shirt, plat gemeten. Kleine afwijkingen van 1–2 cm zijn mogelijk."
          : "Jouw lichaamsmaten. Twijfel je tussen twee maten, kies dan de grootste voor de boxy look."}
      </p>
    </div>
  );
}

function CheckoutForm({
  busy,
  subtotal,
  onSubmit,
}: {
  busy: boolean;
  subtotal: number;
  onSubmit: (c: Customer, shipping: ShippingId) => void;
}) {
  const [c, setC] = useState<Customer>(EMPTY_CUSTOMER);
  const [ship, setShip] = useState<ShippingId>("bpost");
  const fee = shippingFee(ship, subtotal);
  const field = (key: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="checkout-field">
      <span>{label}</span>
      <input
        value={c[key]}
        onChange={(e) => setC({ ...c, [key]: e.target.value })}
        required={!props.placeholder}
        {...props}
      />
    </label>
  );
  return (
    <form
      className="checkout-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(c, ship);
      }}
    >
      <span className="micro">02 — VERZENDING</span>
      {field("name", "Naam", { autoComplete: "name", maxLength: 120 })}
      {field("email", "E-mail", { type: "email", autoComplete: "email", maxLength: 254 })}
      {field("phone", "Telefoon (optioneel)", { type: "tel", autoComplete: "tel", maxLength: 30, placeholder: "+32 …" })}
      {field("street", "Straat en nummer", { autoComplete: "address-line1", maxLength: 200 })}
      <div className="checkout-row">
        {field("postcode", "Postcode", { autoComplete: "postal-code", maxLength: 12 })}
        {field("city", "Gemeente", { autoComplete: "address-level2", maxLength: 80 })}
      </div>
      <label className="checkout-field">
        <span>Land</span>
        <select value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} autoComplete="country">
          {COUNTRIES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </label>
      <fieldset className="shipping-options">
        <legend className="micro">03 — LEVERING</legend>
        {SHIPPING_OPTIONS.map((o) => {
          const f = shippingFee(o.id, subtotal);
          return (
            <label key={o.id} className={ship === o.id ? "active" : ""}>
              <input type="radio" name="shipping" value={o.id} checked={ship === o.id} onChange={() => setShip(o.id)} />
              <span>
                <b>{o.label}</b>
                <small>{o.note}</small>
              </span>
              <em>{f ? money(f) : "Gratis"}</em>
            </label>
          );
        })}
        {subtotal < FREE_FROM && (
          <p className="tiny">Gratis verzending met bpost, GLS of UPS vanaf {money(FREE_FROM)}.</p>
        )}
      </fieldset>
      <div className="cart-total checkout-total">
        <span>TOTAAL</span>
        <b>{money(subtotal + fee)}</b>
      </div>
      <p className="tiny checkout-legal">
        Verzonden {company.dispatchTime} · 14 dagen herroepingsrecht ·
        2 jaar wettelijke garantie. De betaling wordt namens {company.brand} geïnd door{" "}
        {company.paymentCollector.split(" (")[0]}.
      </p>
      <button className="buy" disabled={busy}>
        {busy ? "EVEN GEDULD…" : "BETAAL MET REVOLUT"}
        <ArrowUpRight size={20} />
      </button>
      <p className="tiny checkout-legal">
        Met &ldquo;Betaal met Revolut&rdquo; plaats je een bestelling met betalingsverplichting en ga je akkoord met
        onze <Link href="/voorwaarden">algemene voorwaarden</Link>. Lees ook onze{" "}
        <Link href="/privacy">privacyverklaring</Link> en <Link href="/retour">retourvoorwaarden</Link>.
      </p>
    </form>
  );
}

function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="product-gallery">
      <div
        className="gallery-track"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((src, i) => (
          <div className="gallery-slide" key={src + i}>
            <ProductImage
              className="official-product-photo custom"
              src={src}
              alt={i === 0 ? alt : `${alt} — foto ${i + 1}`}
              sizes="(max-width: 700px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="gallery-dots">
          {images.map((src, i) => (
            <button
              key={src + i}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductImage({ src, alt, className, sizes: sizesAttr }: { src: string; alt: string; className?: string; sizes: string }) {
  return src.startsWith("/") ? (
    <Image className={className} src={src} alt={alt} fill sizes={sizesAttr} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} loading="lazy" />
  );
}
function MoreProduct({
  product,
  onAdd,
}: {
  product: ShopProduct;
  onAdd: (size: Size) => void;
}) {
  const [size, setSize] = useState<Size>();
  return (
    <article className="more-card">
      <div className="more-image">
        {product.image && (
          <ProductImage src={product.image} alt={product.name} sizes="(max-width: 700px) 90vw, 30vw" />
        )}
      </div>
      <div className="more-info">
        <h3>{product.name}</h3>
        <span>{money(product.price)}</span>
      </div>
      <div className="sizes">
        {sizes.map((s) => (
          <button
            key={s}
            aria-pressed={s === size}
            disabled={product.stock[s] <= 0}
            className={`${s === size ? "selected" : ""} ${product.stock[s] <= 0 ? "soldout" : ""}`}
            onClick={() => setSize(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <button className="buy" disabled={!size} onClick={() => size && onAdd(size)}>
        <span>{size ? "IN WINKELMAND" : "KIES JE MAAT"}</span>
        <ArrowUpRight size={20} />
      </button>
    </article>
  );
}
export default function Store({
  products,
  live,
}: {
  products: ShopProduct[];
  live: boolean;
}) {
  const featured = products[0];
  const price = featured.price;
  const color = colors[0];
  const [size, setSize] = useState<Size>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sheet, setSheet] = useState<"cart" | "sizes" | "waitlist" | null>(
    null,
  );
  const [waitSize, setWaitSize] = useState<Size>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [consent, setConsent] = useState<string | null>("loading");
  const [sticky, setSticky] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const viewer = useRef<HTMLDivElement>(null);
  const stock = size ? featured.stock[size] : null;
  const soldOut = (s: Size) => featured.stock[s] <= 0;
  const productOf = (id: string) => products.find((p) => p.id === id);
  useEffect(() => {
    setConsent(localStorage.getItem("la-consent"));
    try {
      const raw = JSON.parse(localStorage.getItem("la-cart") || "[]");
      if (Array.isArray(raw))
        setCart(
          raw
            .filter(
              (i: CartItem) =>
                typeof i?.productId === "string" &&
                sizes.includes(i.size) &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0,
            )
            .reduce(
              (acc: CartItem[], i: CartItem) => addItem(acc, i, products),
              [],
            ),
        );
    } catch {}
    setLoaded(true);
    trackEvent("view_product", { product: "drop-001" });
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("la-cart", JSON.stringify(cart));
  }, [cart, loaded]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) =>
        setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    if (viewer.current) observer.observe(viewer.current);
    return () => observer.disconnect();
  }, []);
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  const total = cart.reduce(
    (n, i) => n + i.quantity * (productOf(i.productId)?.price ?? 0),
    0,
  );
  function addProduct(productId: string, s: Size) {
    setCart((previous) =>
      addItem(previous, { productId, size: s, quantity: 1 }, products),
    );
    trackEvent("add_to_cart", { productId, size: s });
    setError("");
    setSheet("cart");
  }
  function add() {
    if (size) addProduct(featured.id, size);
  }
  function chooseSize(s: Size) {
    if (soldOut(s)) {
      setWaitSize(s);
      setSheet("waitlist");
      return;
    }
    setSize(s);
    trackEvent("select_size", { size: s });
  }
  const cta = (
    <motion.button
      whileTap={{ scale: 0.985, y: 2 }}
      className="buy"
      disabled={!size}
      onClick={add}
    >
      <span>
        {!size ? "KIES JE MAAT" : "IN WINKELMAND"}
        {size ? ` — ${money(price)}` : ""}
      </span>
      <ArrowUpRight size={22} />
    </motion.button>
  );
  return (
    <>
      <header className="nav">
        <a href="#" aria-label="Les Autres, home">
          <Wordmark />
        </a>
        <nav>
          <a href="#drop">DROP 001</a>
          <a href="#perspective">THE PERSPECTIVE</a>
        </nav>
        <button
          className="bag"
          aria-label={`Winkelmand, ${count} artikelen`}
          onClick={() => {
            setError("");
            setSheet("cart");
          }}
        >
          <ShoppingBag size={19} />
          <span>BAG ({count.toString().padStart(2, "0")})</span>
        </button>
      </header>
      <main>
        <section className="hero-section hero-logo">
          <div className="hero-top micro">
            <span>
              INDEPENDENT LABEL
              <br />
              BELGIUM · EST. 2024
            </span>
            <span className="hero-world">
              <Globe size={36} strokeWidth={0.8} />
              <span>
                WORLDWIDE
                <br />
                FOR THE OTHERS
              </span>
            </span>
          </div>
          <div className="hero-backdrop" aria-hidden>
            <Image
              src="/images/les-autres-logo.png"
              alt=""
              width={1504}
              height={540}
              priority
              sizes="(max-width: 700px) 90vw, 70vw"
            />
          </div>
          <div className="hero-title">
            <h1 className="sr-only">Les Autres</h1>
          </div>
          <div className="hero-bottom">
            <p>
              SAME PEOPLE.
              <br />
              <span>DIFFERENT PERSPECTIVE.</span>
            </p>
            <a href="#drop" className="round-link" aria-label="Ontdek Drop 001">
              <ArrowDown size={22} />
            </a>
            <span className="micro">
              NOT FOR EVERYONE.
              <br />
              FOR THE OTHERS.
            </span>
          </div>
          <div className="hero-rule">
            <span>01 / A DIFFERENT POINT OF VIEW</span>
            <span>SCROLL TO EXPLORE ↓</span>
          </div>
        </section>
        <div className="mobile-perspective-photos">
          <ShotCarousel photos={photos} />
        </div>
        <section id="perspective" className="editorial">
          <div className="section-label">
            <span>THE WORLD IS OUR BACKDROP.</span>
          </div>
          <div className="photo-strip">
            {photos.map((photo, i) => (
              <div className={`photo photo-${i}`} key={i}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 700px) 80vw, 25vw"
                />
              </div>
            ))}
          </div>
        </section>
        <section id="drop" className="product-section">
          <div
            className="product-stage photo-mode"
            ref={viewer}
          >
            <div className="stage-label">
              <span className="micro">THE FIRST CHAPTER</span>
              <span className="edition">001</span>
            </div>
            <div className="product-render">
                <ProductGallery
                  images={featured.images?.length ? featured.images : [featured.image]}
                  alt={featured.name}
                />
            </div>
            <div className="viewer-foot">
              <span className="micro">240 GSM · 100% COTTON</span>
            </div>
          </div>
          <div className="product-info">
            <div className="drop-label">
              <span className="pink-dot" /> DROP 001{" "}
              <span>· LIMITED EDITION</span>
            </div>
            <h2>{featured.name.toUpperCase()}</h2>
            <div className="price-row">
              <span>{money(price)}</span>
              <span>BOX FIT. BIG ENERGY.</span>
            </div>
            {featured.description && (
              <p className="description">{featured.description}</p>
            )}
            {!live && (
              <p className="preview-note">PREVIEW · voorbeeldprijs & voorraad</p>
            )}
            <p className="single-edition">OFF-WHITE · ORIGINAL PRINT</p>
            <div className="selector-head">
              <span>01 — MAAT</span>
              <button className="text-button" onClick={() => setSheet("sizes")}>
                MAATTABEL <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="sizes">
              {sizes.map((s) => (
                <button
                  key={s}
                  aria-pressed={s === size}
                  aria-label={soldOut(s) ? `${s}, uitverkocht, meld me aan` : s}
                  className={`${s === size ? "selected" : ""} ${soldOut(s) ? "soldout" : ""}`}
                  onClick={() => chooseSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="stock-line" aria-live="polite">
              {stock !== null && stock <= 3 ? (
                <>
                  <span className="pink-dot" /> Nog {stock} in deze maat
                  {!live && " · voorbeeldvoorraad"}
                </>
              ) : (
                <>Oversized fit. Neem je eigen maat voor de boxy look.</>
              )}
            </div>
            {cta}
            <div className="trust">
              <span>
                <Truck /> Vanuit België
              </span>
              <span>
                <RotateCcw />
                14 dagen retour
              </span>
              <span>
                <Lock />
                Veilig betalen
              </span>
            </div>
            <div className="payments">
              <b>Revolut Pay</b>
              <span>Apple Pay</span>
              <span>G Pay</span>
              <b>VISA</b>
              <span>mastercard</span>
            </div>
            {!live && (
              <p className="tiny delivery">
                Levertijd wordt bevestigd bij lancering. Betalen is nog niet
                actief.
              </p>
            )}
            <div className="accordions">
              {[
                {
                  title: "MATERIAAL & PASVORM",
                  body: "100% katoen. 240 GSM. Een stevige, zachte stof met een boxy, oversized pasvorm. Brede schouders, ruime mouwen en een rechte zoom.",
                },
                {
                  title: "VERZENDING & RETOUR",
                  body: `Verzending vanuit België, ${company.shippingCost}. We verzenden ${company.dispatchTime}; je krijgt een trackinglink. Je hebt 14 dagen na ontvangst om te herroepen en 2 jaar wettelijke garantie.`,
                },
                {
                  title: "CARE FOR YOUR OTHERS",
                  body: "Binnenstebuiten wassen op 30°C met vergelijkbare kleuren. Niet in de droger. Aan de lucht laten drogen. Strijk nooit rechtstreeks op de print.",
                },
              ].map((item) => (
                <details key={item.title}>
                  <summary>
                    {item.title}
                    <Plus size={16} />
                  </summary>
                  <p>{item.body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="anthem real-drop" id="in-real-life">
          <div className="anthem-frame">
            <video
              src="/video/drop-001-unboxing.mp4"
              poster="/video/drop-001-unboxing-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Verpakte Baddies Tees van Drop 001, klaar om te verzenden"
            />
          </div>
          <div className="anthem-copy">
            <span className="micro">IN REAL LIFE</span>
            <h2>
              FRESH OFF
              <br />
              <span>THE PRESS.</span>
            </h2>
            <p>
              Geen render, geen mock-up. Drop 001 ligt hier: echt katoen, echte print, verpakt en klaar om naar
              jou te vertrekken.
            </p>
            <a href="#drop" className="buy">
              <span>CLAIM JE TEE — {money(price)}</span>
              <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
        <section className="anthem" id="anthem">
          <AnthemVideo />
          <div className="anthem-copy">
            <span className="micro">THE ANTHEM</span>
            <h2>
              BADDIES IN
              <br />
              <span>BELGICA.</span>
            </h2>
            <p>
              Het nummer achter de print. Belgica, Hollanda, Fransa, Espagna —
              zet je geluid aan.
            </p>
            <a href="#drop" className="buy">
              <span>SHOP THE TEE — {money(price)}</span>
              <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
        {products.length > 1 && (
          <section className="more-products" id="more">
            <div className="section-label">
              <span>MORE FROM LES AUTRES.</span>
              <span>DROP 001</span>
            </div>
            <div className="more-grid">
              {products.slice(1).map((p) => (
                <MoreProduct
                  key={p.id}
                  product={p}
                  onAdd={(s) => addProduct(p.id, s)}
                />
              ))}
            </div>
          </section>
        )}
        <section className="manifesto">
          <span className="micro">IT WAS NEVER JUST A T-SHIRT.</span>
          <h2>
            SAME PEOPLE.
            <br />
            <span>DIFFERENT</span>
            <br />
            PERSPECTIVE.
          </h2>
          <div className="manifesto-bottom">
            <Globe size={64} strokeWidth={0.6} />
            <p>
              Voor wie er net anders naar kijkt.
              <br />
              Van België naar overal.
              <br />
              Les Autres. Since 2024.
            </p>
            <span className="micro">
              BE YOURSELF.
              <br />
              THAT'S THE WHOLE POINT.
            </span>
          </div>
        </section>
        <section className="newsletter">
          <div>
            <span className="drop-label">STAY ON THE OTHER SIDE.</span>
            <h2>
              DON’T MISS
              <br />
              WHAT’S NEXT<span>.</span>
            </h2>
            <p>Nieuwe drops. Als eerste in jouw inbox.</p>
          </div>
          <Subscribe />
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <Wordmark />
          <span className="micro">
            EST. 2024
            <br />
            WORLDWIDE FOR THE OTHERS
          </span>
          <a href="#drop">
            BACK TO THE DROP <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LES AUTRES</span>
          <div>
            <Link href="/voorwaarden">Voorwaarden</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/retour">Retour</Link>
            <Link href="/verzending">Verzending</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/herroepen">Herroep de overeenkomst hier</Link>
            <button onClick={() => setConsent(null)}>Cookie-instellingen</button>
          </div>
          <span>BELGIUM, WORLDWIDE.</span>
        </div>
        <p className="business-note">
          {[
            company.legalName && `${company.legalName}${company.legalForm ? ` ${company.legalForm}` : ""}`,
            company.address,
            company.enterpriseNumber && `KBO ${company.enterpriseNumber}`,
            company.vatNumber && company.vatNumber !== company.enterpriseNumber && `btw ${company.vatNumber}`,
            company.email,
          ]
            .filter(Boolean)
            .join(" · ") || "Les Autres · België"}
        </p>
        <a
          className="created-by"
          href="https://solynglobal.be"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by Solyn Global <ArrowUpRight size={14} />
        </a>
      </footer>
      {sticky && !sheet && (
        <div className="sticky-buy">
          <div>
            <b>{featured.name.toUpperCase()}</b>
            <span>{size ? `Maat ${size}` : money(price)}</span>
          </div>
          {size ? (
            cta
          ) : (
            <a href="#drop" className="buy">
              KIES JE MAAT <ArrowUpRight size={20} />
            </a>
          )}
        </div>
      )}
      {consent === null && (
        <aside className="cookie-banner" aria-label="Cookiekeuze">
          <p>
            Alleen de essentials?
            <span>
              We bewaren je winkelmand. Analytics alleen als jij dat goed vindt.{" "}
              <Link href="/cookies">Meer info</Link>
            </span>
          </p>
          <div>
            <button
              onClick={() => {
                localStorage.setItem("la-consent", "declined");
                setConsent("declined");
              }}
            >
              Alleen noodzakelijk
            </button>
            <button
              onClick={() => {
                localStorage.setItem("la-consent", "accepted");
                setConsent("accepted");
              }}
            >
              Accepteren <Check size={14} />
            </button>
          </div>
        </aside>
      )}
      {sheet === "sizes" && (
        <Sheet title="FIND YOUR FIT." onClose={() => setSheet(null)}>
          <p>
            Boxy / oversized. Kies je gebruikelijke maat voor de bedoelde
            pasvorm, of een maat kleiner voor minder volume.
          </p>
          <SizeGuide />
        </Sheet>
      )}
      {sheet === "waitlist" && (
        <Sheet title={`JOUW MAAT. BINNENKORT.`} onClose={() => setSheet(null)}>
          <p>
            Laat weten wanneer <b>{waitSize}</b> in <b>{color.name}</b> terug
            is.
          </p>
          <Subscribe size={waitSize} color={color.id} />
        </Sheet>
      )}
      {sheet === "cart" && (
        <Sheet
          title={`YOUR BAG (${count.toString().padStart(2, "0")})`}
          onClose={() => setSheet(null)}
        >
          {!count ? (
            <div className="empty-cart">
              <ShoppingBag size={38} />
              <p>Nog ruimte voor een ander perspectief.</p>
              <button className="buy" onClick={() => setSheet(null)}>
                ONTDEK DROP 001 <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-list">
                {cart.map((item, i) => {
                  const p = productOf(item.productId);
                  if (!p) return null;
                  return (
                    <div
                      className="cart-item"
                      key={`${item.productId}-${item.size}`}
                    >
                      <div className="cart-thumb">
                        {p.image ? (
                          <ProductImage src={p.image} alt="" sizes="80px" />
                        ) : (
                          <ShirtFallback color={color} />
                        )}
                      </div>
                      <div>
                        <b>{p.name.toUpperCase()}</b>
                        <p>Maat {item.size}</p>
                        <strong>{money(p.price * item.quantity)}</strong>
                        <div className="quantity">
                          <button
                            aria-label={`Verminder ${item.size}`}
                            onClick={() =>
                              setCart(
                                cart.flatMap((x, j) =>
                                  i === j
                                    ? x.quantity > 1
                                      ? [{ ...x, quantity: x.quantity - 1 }]
                                      : []
                                    : [x],
                                ),
                              )
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            disabled={item.quantity >= p.stock[item.size]}
                            aria-label={`Verhoog ${item.size}`}
                            onClick={() =>
                              setCart(
                                addItem(cart, { ...item, quantity: 1 }, products),
                              )
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        aria-label={`Verwijder ${p.name}, ${item.size}`}
                        onClick={() => setCart(cart.filter((_, j) => j !== i))}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="cart-total">
                <span>SUBTOTAAL</span>
                <b>{money(total)}</b>
              </div>
              <p className="tiny">
                Inclusief btw · gratis verzending vanaf € 50 · veilig betalen via Revolut.
              </p>
              {checkoutStep ? (
                <CheckoutForm
                  busy={busy}
                  subtotal={total}
                  onSubmit={async (customer, shipping) => {
                    setBusy(true);
                    setError("");
                    try {
                      await onCheckout(cart, customer, shipping);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              ) : (
                <button className="buy" onClick={() => setCheckoutStep(true)}>
                  NAAR CHECKOUT
                  <ArrowUpRight size={20} />
                </button>
              )}
              <p role="status" className="form-status">
                {error}
              </p>
              {!live && (
                <p className="tiny">
                  Preview: er wordt geen bestelling geplaatst of betaling
                  uitgevoerd.
                </p>
              )}
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
