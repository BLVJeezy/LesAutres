"use client";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useId,
  createContext,
  useContext,
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
import { DICTS, LANGS, LANG_COOKIE, HTML_LANG, detectLang, isLang, type Dict, type Lang } from "@/lib/i18n";
import { adviseSize } from "@/lib/fit";
import { BUNDLE_PRODUCTS, BUNDLES, bundlePriceFor, cartDiscount } from "@/lib/bundles";
import { FREE_FROM, SHIPPING_OPTIONS, shippingFee, type ShippingId } from "@/lib/shipping";
import { EMPTY_CUSTOMER, onSubscribe, onCheckout, trackEvent, type Customer } from "@/lib/integrations";
import { ShirtFallback } from "./shirt-fallback";
import { Lookbook } from "./lookbook";
import { AnthemVideo } from "./anthem-video";
const I18n = createContext<Dict>(DICTS.nl);
const useT = () => useContext(I18n);
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
  const t = useT();
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
        <button aria-label={t.close} onClick={onClose}>
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
  const t = useT();
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
              ? t.subscribedRestock
              : t.subscribedDrop,
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
          aria-label={t.email}
          type="email"
          placeholder={t.emailPlaceholder}
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button aria-label={t.subscribe} disabled={busy}>
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
          {t.consent(size ? t.consentSize : t.consentDrops)}
          <Link href="/privacy">{t.privacyPolicy}</Link>
          {t.consentEnd}
        </span>
      </label>
      <p className="form-status" role="status">
        {status}
      </p>
    </form>
  );
}
const L = (n: number, w: number, h: number, alt: string) => ({ src: `/images/lookbook-${String(n).padStart(2, "0")}.jpg`, w, h, alt });
/** Lookbook carousel: film shots of Drop 001 plus the two product details. */
const lookbook = [
  L(7, 1600, 1070, "Vier vrienden in de Baddies Tee in de studio"),
  L(1, 1070, 1600, "Portret in de Baddies Tee met pet"),
  { src: "/images/perspective-labels.jpg", w: 1500, h: 2000, alt: "Les Autres-nekbedrukking in witte Baddies Tees, 100% katoen" },
  L(2, 1600, 1070, "De crew in de Baddies Tee voor de SOUNDPlug-muur"),
  L(5, 1070, 1600, "Baddies Tee vastgehouden aan de schouders"),
  L(3, 1600, 1070, "Twee vrienden in de Baddies Tee in de studio"),
  { src: "/images/perspective-print.jpg", w: 1600, h: 1067, alt: "Close-up van de BADDIES IN BELGICA print" },
  L(6, 1070, 1600, "Leunend tegen het bureau in de Baddies Tee"),
  L(4, 1070, 1600, "Drie vrienden in de Baddies Tee"),
  L(8, 1070, 1600, "Vier vrienden in de Baddies Tee onder het SOUNDPlug-logo"),
  L(9, 1070, 1600, "Twee vrienden in de Baddies Tee, full look"),
  L(10, 1070, 1600, "De crew in de Baddies Tee, full look"),
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
  back: [60, 63, 66, 69, 71, 71.5],
  shoulder: [52, 53.5, 55, 57, 59, 61],
  body: [53.5, 56.5, 59.5, 63.5, 67.5, 70.5],
  sleeve: [46, 48, 50, 52, 53, 54],
};
const PRODUCT_IN: Record<string, string[]> = {
  back: ["23 1/2", "24 3/4", "26", "27 1/4", "28", "28 1/4"],
  shoulder: ["20 1/2", "21", "21 3/4", "22 1/2", "23 1/4", "24"],
  body: ["21", "22 1/4", "23 1/2", "25", "26 1/2", "27 3/4"],
  sleeve: ["18", "19", "19 3/4", "20 1/2", "20 3/4", "21 1/4"],
};
const BODY_CM: Record<string, string[]> = {
  chest: ["80–88", "88–96", "96–104", "104–112", "112–120", "120–128"],
  waist: ["66–72", "68–76", "76–84", "84–92", "92–100", "100–108"],
};
const BODY_IN: Record<string, string[]> = {
  chest: ["31 1/2–34 3/4", "34 3/4–37 3/4", "37 3/4–41", "41–44", "44–47 1/4", "47 1/4–50 1/2"],
  waist: ["26–28 1/4", "26 3/4–30", "30–33", "33–36 1/4", "36 1/4–39 1/4", "39 1/4–42 1/2"],
};

function SizeGuide() {
  const [tab, setTab] = useState<"product" | "body">("product");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const data = tab === "product" ? (unit === "cm" ? PRODUCT_CM : PRODUCT_IN) : unit === "cm" ? BODY_CM : BODY_IN;
  const cols = Object.keys(data) as (keyof Dict["sizeCols"])[];
  const t = useT();
  return (
    <div className="size-table">
      <div className="size-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "product"} onClick={() => setTab("product")}>
          {t.productDims}
        </button>
        <button role="tab" aria-selected={tab === "body"} onClick={() => setTab("body")}>
          {t.bodyDims}
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
              <th>{t.size}</th>
              {cols.map((c) => (
                <th key={c}>{t.sizeCols[c]}</th>
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
          ? t.productNote
          : t.bodyNote}
      </p>
    </div>
  );
}

function FitAdvisor({ open, onPick }: { open: boolean; onPick: (s: Size) => void }) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const advice = adviseSize(Number(height), Number(weight));
  const t = useT();
  if (!open) return null;
  return (
    <div className="fit-advisor">
      <div className="fit-inputs">
        <label>
          <span>{t.height}</span>
          <input inputMode="numeric" placeholder="178" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          <em>cm</em>
        </label>
        <label>
          <span>{t.weight}</span>
          <input inputMode="numeric" placeholder="72" value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          <em>kg</em>
        </label>
      </div>
      {advice ? (
        <div className="fit-result">
          <p>
            {t.fitAdvice(advice)[0]}<b>{advice}</b>{t.fitAdvice(advice)[2]}
          </p>
          <button className="fit-pick" onClick={() => onPick(advice)}>
            {t.pick(advice)}
          </button>
        </div>
      ) : (
        <p className="fit-hint">{t.fitHint}</p>
      )}
    </div>
  );
}

function BundlePicker({
  unit,
  image,
  defaultSize,
  maxQty,
  soldOut,
  isSoldOut,
  onAdd,
}: {
  unit: number;
  image: string;
  defaultSize?: Size;
  maxQty: number;
  soldOut: boolean;
  isSoldOut: (s: Size) => boolean;
  onAdd: (sizes: Size[]) => void;
}) {
  const [qty, setQty] = useState<number>(1);
  const [picked, setPicked] = useState<Size[]>([]);
  const firstFree = sizes.find((s) => !isSoldOut(s)) ?? "M";
  const fallback = defaultSize && !isSoldOut(defaultSize) ? defaultSize : sizes.includes("M") && !isSoldOut("M") ? "M" : firstFree;
  const sizeAt = (i: number) => picked[i] ?? fallback;
  const price = bundlePriceFor(qty, unit);
  const t = useT();
  return (
    <div className="bundles">
      <div className="bundle-options" role="radiogroup" aria-label={t.teeCount}>
        {BUNDLES.map((b) => {
          const total = bundlePriceFor(b.qty, unit);
          const save = b.qty * unit - total;
          return (
            <button
              key={b.qty}
              role="radio"
              aria-checked={qty === b.qty}
              className={qty === b.qty ? "selected" : ""}
              onClick={() => setQty(b.qty)}
            >
              {b.qty === 2 && <em className="bundle-tag">{t.popular}</em>}
              {b.qty === 3 && <em className="bundle-tag dark">{t.bestDeal}</em>}
              <span className={`bundle-thumbs n${b.qty}`} aria-hidden>
                {Array.from({ length: b.qty }, (_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={image} alt="" loading="lazy" />
                ))}
              </span>
              <b>{b.label.toUpperCase()}</b>
              <span className="bundle-price">{money(total)}</span>
              {b.qty > 1 && <s>{money(b.qty * unit)}</s>}
              <small>{save > 0 ? t.save(money(save)) : t.perPiece(money(unit))}</small>
            </button>
          );
        })}
        <button
          role="radio"
          aria-checked={qty > 3}
          className={`bundle-more ${qty > 3 ? "selected" : ""}`}
          onClick={() => setQty((q) => (q > 3 ? q : 4))}
        >
          <span className="bundle-thumbs n3" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={image} alt="" loading="lazy" />
            ))}
          </span>
          <b>4+ TEES</b>
          <span className="bundle-price">{money(Math.round(BUNDLES[2].price / 3))}</span>
          <small>{t.perPieceTop}</small>
        </button>
      </div>
      {qty > 3 && (
        <div className="bundle-stepper">
          <span>{t.amountTees}</span>
          <button aria-label={t.less} onClick={() => setQty((q) => Math.max(4, q - 1))} disabled={qty <= 4}>
            <Minus size={14} />
          </button>
          <b>{qty}</b>
          <button aria-label={t.more} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>
            <Plus size={14} />
          </button>
        </div>
      )}
      <div className="bundle-sizes">
        {Array.from({ length: qty }, (_, i) => (
          <label key={i}>
            <span>TEE {i + 1}</span>
            <select
              value={sizeAt(i)}
              onChange={(e) => {
                const next = Array.from({ length: Math.max(qty, picked.length) }, (_, j) => sizeAt(j));
                next[i] = e.target.value as Size;
                setPicked(next);
              }}
            >
              {sizes.map((s) => (
                <option key={s} value={s} disabled={isSoldOut(s)}>
                  {isSoldOut(s) ? `${s} — ${t.soldOut}` : s}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        className="buy bundle-add"
        disabled={soldOut || qty > maxQty}
        onClick={() => onAdd(Array.from({ length: qty }, (_, i) => sizeAt(i)))}
      >
        <span>
          {soldOut ? t.soldOut : t.teesToBag(qty, money(price))}
        </span>
        <ArrowUpRight size={22} />
      </button>
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
  const t = useT();
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
      <span className="micro">{t.shippingHead}</span>
      {field("name", t.name, { autoComplete: "name", maxLength: 120 })}
      {field("email", t.emailShort, { type: "email", autoComplete: "email", maxLength: 254 })}
      {field("phone", t.phone, { type: "tel", autoComplete: "tel", maxLength: 30 })}
      {field("street", t.street, { autoComplete: "address-line1", maxLength: 200 })}
      <div className="checkout-row">
        {field("postcode", t.postcode, { autoComplete: "postal-code", maxLength: 12 })}
        {field("city", t.city, { autoComplete: "address-level2", maxLength: 80 })}
      </div>
      <label className="checkout-field">
        <span>{t.country}</span>
        <select value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} autoComplete="country">
          {COUNTRIES.map(([code]) => (
            <option key={code} value={code}>{t.countries[code]}</option>
          ))}
        </select>
      </label>
      <fieldset className="shipping-options">
        <legend className="micro">{t.deliveryHead}</legend>
        {SHIPPING_OPTIONS.map((o) => {
          const f = shippingFee(o.id, subtotal);
          return (
            <label key={o.id} className={ship === o.id ? "active" : ""}>
              <input type="radio" name="shipping" value={o.id} checked={ship === o.id} onChange={() => setShip(o.id)} />
              <span>
                <b>{t.shipping[o.id]?.[0] ?? o.label}</b>
                <small>{t.shipping[o.id]?.[1] ?? o.note}</small>
              </span>
              <em>{f ? money(f) : t.free}</em>
            </label>
          );
        })}
        {subtotal < FREE_FROM && (
          <p className="tiny">{t.freeFrom(money(FREE_FROM))}</p>
        )}
      </fieldset>
      <div className="cart-total checkout-total">
        <span>{t.total}</span>
        <b>{money(subtotal + fee)}</b>
      </div>
      <p className="tiny checkout-legal">
        {t.checkoutLegal(company.paymentCollector.split(" (")[0])}
      </p>
      <button className="buy" disabled={busy}>
        {busy ? t.wait : t.payRevolut}
        <ArrowUpRight size={20} />
      </button>
      <p className="tiny checkout-legal">
        {t.terms[0]}<Link href="/voorwaarden">{t.terms[1]}</Link>{t.terms[2]}
        <Link href="/privacy">{t.terms[3]}</Link>{t.terms[4]}<Link href="/retour">{t.terms[5]}</Link>{t.terms[6]}
      </p>
    </form>
  );
}

function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const t = useT();
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
            {src.endsWith(".mp4") ? (
              <video
                className="official-product-photo custom gallery-video"
                src={src}
                poster={src.replace(/\.mp4$/, "-poster.jpg")}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={`${alt} — ${t.video}`}
              />
            ) : (
              <ProductImage
                className="official-product-photo custom"
                src={src}
                alt={i === 0 ? alt : `${alt} — ${t.photo(i + 1)}`}
                sizes="(max-width: 700px) 100vw, 50vw"
              />
            )}
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="gallery-dots">
          {images.map((src, i) => (
            <button
              key={src + i}
              aria-label={t.photoBtn(i + 1)}
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
function V2Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="v2-gallery">
      <div className="v2-main">
        <ProductImage src={images[i]} alt={i === 0 ? alt : `${alt} — ${i + 1}`} sizes="(max-width: 900px) 100vw, 55vw" className="v2-main-img" />
      </div>
      <div className="v2-thumbs">
        {images.map((src, n) => (
          <button key={src + n} aria-label={`${alt} ${n + 1}`} aria-current={n === i || undefined} onClick={() => setI(n)}>
            <ProductImage src={src} alt="" sizes="96px" />
          </button>
        ))}
      </div>
    </div>
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
  const t = useT();
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
        <span>{size ? t.addToBag : t.chooseSize}</span>
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
  const [fitOpen, setFitOpen] = useState(false);
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
  const [cartId, setCartId] = useState("");
  const [drop, setDrop] = useState<{ limit: number; remaining: number; active?: boolean } | null>(null);
  const [reservedUntil, setReservedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const viewer = useRef<HTMLDivElement>(null);
  const [lang, setLangState] = useState<Lang>("nl");
  const t = DICTS[lang];
  function setLang(l: Lang) {
    setLangState(l);
    document.documentElement.lang = HTML_LANG[l];
    try {
      localStorage.setItem(LANG_COOKIE, l);
    } catch {}
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }
  const soldOut = (s: Size) => featured.stock[s] <= 0;
  const productOf = (id: string) => products.find((p) => p.id === id);
  useEffect(() => {
    setConsent(localStorage.getItem("la-consent"));
    const savedLang = localStorage.getItem(LANG_COOKIE);
    setLang(isLang(savedLang) ? savedLang : detectLang(navigator.languages));
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
    let id = localStorage.getItem("la-cart-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("la-cart-id", id);
    }
    setCartId(id);
    fetch(`/api/drop?cart=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDrop(d))
      .catch(() => {});
    setLoaded(true);
    trackEvent("page_view");
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
  const discount = cartDiscount(cart, (id) => productOf(id)?.price ?? 0);
  const dropQty = cart.filter((c) => BUNDLE_PRODUCTS.includes(c.productId)).reduce((n, c) => n + c.quantity, 0);
  const left = drop ? drop.remaining : null;
  const dropSoldOut = left !== null && left <= 0 && dropQty === 0;
  async function reserveBag(qty: number) {
    if (!cartId) return;
    try {
      const r = await fetch("/api/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, qty }),
      });
      const d = await r.json();
      if (typeof d.remaining === "number") setDrop({ limit: d.limit, remaining: d.remaining, active: d.active });
      if (r.ok) {
        setReservedUntil(d.expiresAt ?? null);
      } else if (r.status === 409) {
        setReservedUntil(null);
        setError(
          d.remaining
            ? t.onlyLeft(d.remaining)
            : t.soldOutMsg,
        );
      }
    } catch {}
  }
  useEffect(() => {
    if (loaded && cartId) reserveBag(dropQty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropQty, loaded, cartId]);
  useEffect(() => {
    if (!reservedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [reservedUntil]);
  const msLeft = reservedUntil ? reservedUntil - now : 0;
  const reservationLabel = `${String(Math.floor(Math.max(0, msLeft) / 60000)).padStart(2, "0")}:${String(Math.floor((Math.max(0, msLeft) % 60000) / 1000)).padStart(2, "0")}`;
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
  function addBundle(picked: Size[]) {
    setCart((previous) =>
      picked.reduce((acc, s) => addItem(acc, { productId: featured.id, size: s, quantity: 1 }, products), previous),
    );
    trackEvent("add_to_cart", { productId: featured.id, bundle: picked.length, sizes: picked });
    setError("");
    setSheet("cart");
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
      disabled={!size || dropSoldOut}
      onClick={add}
    >
      <span>
        {dropSoldOut ? t.soldOut : !size ? t.chooseSize : t.addToBag}
        {size ? ` — ${money(price)}` : ""}
      </span>
      <ArrowUpRight size={22} />
    </motion.button>
  );
  return (
    <I18n.Provider value={t}>
      <div className="v2-announce">
        <span>{t.home.announce[0]}</span>
        <span aria-hidden>—</span>
        <span>{t.home.announce[1]}</span>
      </div>
      <header className="v2-header">
        <a href="#drop" className="v2-nav-link">{t.home.shop}</a>
        <a href="#" className="v2-logo" aria-label="Les Autres, home">
          <Image src="/images/les-autres-logo.png" alt="Les Autres" width={1504} height={540} priority sizes="180px" />
        </a>
        <div className="v2-header-right">
          <label className="v2-lang">
            <span className="sr-only">{t.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <button
            className="v2-bag"
            aria-label={t.bagLabel(count)}
            onClick={() => {
              setError("");
              setSheet("cart");
            }}
          >
            <span className="v2-bag-text">BAG ( {count} )</span>
            <ShoppingBag size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <main className="v2">
        <section className="v2-hero">
          <Image src="/images/lookbook-07.jpg" alt="De crew in The Baddies Tee" fill priority sizes="100vw" />
          <div className="v2-hero-copy">
            <span className="v2-eyebrow light">LES AUTRES × ISSAH</span>
            <h1>THE BADDIES TEE</h1>
            <a href="#drop" className="v2-btn light">{t.home.shopTee}</a>
          </div>
        </section>

        <section id="drop" className="v2-product" ref={viewer}>
          <V2Gallery
            images={[...(featured.images?.length ? featured.images : [featured.image]), "/images/model-studio.jpg", "/images/model-wall.jpg"]}
            alt={featured.name}
          />
          <div className="v2-info">
            <div className="v2-meta">
              <span>LES AUTRES × ISSAH</span>
              <span>DROP 001</span>
            </div>
            <div className="v2-title-row">
              <h2>{featured.name}</h2>
              <span className="v2-price">{money(price)}</span>
            </div>
            <p className="v2-intro">
              {t.home.intro[0]}
              <br />
              {t.home.intro[1]}
            </p>
            {!live && <p className="preview-note">{t.preview}</p>}
            <div className="v2-color">
              <span className="v2-label">{t.home.color}</span>
              <span>{t.home.white}</span>
              <span className="v2-swatch" aria-hidden />
            </div>
            <div className="v2-size-head">
              <span className="v2-label">{t.home.chooseSize}</span>
              <button className="v2-underline" onClick={() => setSheet("sizes")}>
                {t.home.fit}
              </button>
            </div>
            <div className="v2-sizes">
              {sizes.map((s) => (
                <button
                  key={s}
                  aria-pressed={s === size}
                  aria-label={soldOut(s) ? t.sizeSoldOut(s) : s}
                  className={`${s === size ? "selected" : ""} ${soldOut(s) ? "soldout" : ""}`}
                  onClick={() => chooseSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <FitAdvisor open={fitOpen} onPick={(s) => { chooseSize(s); trackEvent("size_advice", { size: s }); }} />
            <button className="v2-cta" disabled={dropSoldOut} onClick={() => {
                if (size) return add();
                const el = document.querySelector(".v2-sizes");
                el?.classList.remove("flash");
                void (el as HTMLElement | null)?.offsetWidth;
                el?.classList.add("flash");
              }}>
              {dropSoldOut ? t.soldOut : size ? `${t.addToBag} — ${money(price)}` : t.home.chooseSize.toUpperCase()}
            </button>
            <div className="v2-perks">
              <span>{t.home.perks[0]}</span>
              <span>{t.home.perks[1]}</span>
            </div>
            <div className="v2-accordions">
              {t.accordions.map(([, body], i) => (
                <details key={i}>
                  <summary>
                    {t.home.accordionTitles[i]}
                    <Plus size={20} strokeWidth={1.5} />
                  </summary>
                  <p>{body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="v2-campaign" id="perspective">
          <div className="v2-campaign-head">
            <h2>The campaign.</h2>
            <span>LES AUTRES × ISSAH</span>
          </div>
          <div className="v2-campaign-grid">
            <figure>
              <div className="v2-frame tall">
                <Image src="/images/lookbook-03.jpg" alt="Twee vrienden in The Baddies Tee in de studio" fill sizes="(max-width: 700px) 50vw, 33vw" />
              </div>
              <figcaption>01 / IN THE STUDIO</figcaption>
            </figure>
            <figure>
              <div className="v2-frame tall">
                <Image src="/images/lookbook-10.jpg" alt="De crew in The Baddies Tee" fill sizes="(max-width: 700px) 50vw, 33vw" />
              </div>
              <figcaption>02 / THE OTHERS</figcaption>
            </figure>
            <figure className="wide">
              <div className="v2-frame wide">
                <Image src="/images/lookbook-04.jpg" alt="Drie vrienden in The Baddies Tee" fill sizes="100vw" />
              </div>
              <figcaption>03 / LES AUTRES × ISSAH</figcaption>
            </figure>
          </div>
        </section>

        <section className="v2-perspective">
          <span className="v2-eyebrow">THE PERSPECTIVE</span>
          <h2>
            Same people.
            <br />
            <span>Different perspective.</span>
          </h2>
          <p>
            {t.home.perspectiveText[0]}
            <br />
            {t.home.perspectiveText[1]}
          </p>
          <a href="#drop" className="v2-underline big">{t.home.shopBaddies}</a>
        </section>
      </main>
      <footer className="v2-footer">
        <div className="v2-footer-top">
          <Image src="/images/les-autres-logo.png" alt="Les Autres" width={1504} height={540} sizes="180px" className="v2-footer-logo" />
          <nav>
            <a href="https://www.instagram.com/lesautres.be/" target="_blank" rel="noopener noreferrer">INSTAGRAM</a>
            <a href={`mailto:${company.email}`}>{t.home.contact.toUpperCase()}</a>
          </nav>
        </div>
        <div className="v2-footer-links">
          <Link href="/voorwaarden">{t.footer.terms}</Link>
          <Link href="/privacy">{t.footer.privacy}</Link>
          <Link href="/retour">{t.footer.returns}</Link>
          <Link href="/verzending">{t.footer.shipping}</Link>
          <Link href="/cookies">{t.footer.cookies}</Link>
          <Link href="/herroepen">{t.footer.withdraw}</Link>
          <button onClick={() => setConsent(null)}>{t.footer.cookieSettings}</button>
        </div>
        {lang !== "nl" && <p className="v2-footer-note">{t.legalNote}</p>}
        <p className="v2-footer-note">
          © {new Date().getFullYear()} Les Autres ·{" "}
          {[
            company.legalName && `${company.legalName}`,
            company.enterpriseNumber && `Company No. ${company.enterpriseNumber}`,
            company.email,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </footer>
      {sticky && !sheet && (
        <div className="sticky-buy">
          <div>
            <b>{featured.name.toUpperCase()}</b>
            <span>{money(price)}</span>
          </div>
          <a href="#drop" className="buy">
            {t.addToBag} <ArrowUpRight size={20} />
          </a>
        </div>
      )}
      {consent === null && (
        <aside className="cookie-banner" aria-label={t.cookieLabel}>
          <p>
            {t.cookieTitle}
            <span>
              {t.cookieText}{" "}
              <Link href="/cookies">{t.moreInfo}</Link>
            </span>
          </p>
          <div>
            <button
              onClick={() => {
                localStorage.setItem("la-consent", "declined");
                setConsent("declined");
              }}
            >
              {t.necessary}
            </button>
            <button
              onClick={() => {
                localStorage.setItem("la-consent", "accepted");
                setConsent("accepted");
                trackEvent("page_view");
                trackEvent("view_product", { product: "drop-001" });
              }}
            >
              {t.accept} <Check size={14} />
            </button>
          </div>
        </aside>
      )}
      {sheet === "sizes" && (
        <Sheet title="FIND YOUR FIT." onClose={() => setSheet(null)}>
          <p>
            {t.fitSheet}
          </p>
          <SizeGuide />
        </Sheet>
      )}
      {sheet === "waitlist" && (
        <Sheet title={t.waitTitle} onClose={() => setSheet(null)}>
          <p>
            {t.waitText("", "")[0]}<b>{waitSize}</b>{t.waitText("", "")[2]}<b>{color.name}</b>{t.waitText("", "")[4]}
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
              <p>{t.emptyBag}</p>
              <button className="buy" onClick={() => setSheet(null)}>
                {t.discover.toUpperCase()} <ArrowRight size={20} />
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
                        <p>{t.sizeShort(item.size)}</p>
                        <strong>{money(p.price * item.quantity)}</strong>
                        <div className="quantity">
                          <button
                            aria-label={t.decrease(item.size)}
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
                            aria-label={t.increase(item.size)}
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
                        aria-label={t.remove(p.name, item.size)}
                        onClick={() => setCart(cart.filter((_, j) => j !== i))}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              {dropQty > 0 && reservedUntil && drop?.active !== false && (
                <div className={`reservation ${msLeft <= 0 ? "expired" : ""}`} role="status">
                  {msLeft > 0 ? (
                    <>
                      <span>{t.reserved}</span>
                      <b>{reservationLabel}</b>
                    </>
                  ) : (
                    <>
                      <span>{t.expired}</span>
                      <button className="text-button" onClick={() => reserveBag(dropQty)}>
                        {t.reserveAgain}
                      </button>
                    </>
                  )}
                </div>
              )}
              {(dropQty === 1 || dropQty === 2) && (left === null || left > 0) && (() => {
                const n = dropQty + 1;
                const total = bundlePriceFor(n, price);
                const lastSize = [...cart].reverse().find((c) => BUNDLE_PRODUCTS.includes(c.productId))?.size ?? "M";
                return (
                  <div className="upsell">
                    <p>{t.upsell(n, money(total), money(n * price - total))}</p>
                    <button className="text-button" onClick={() => addProduct(featured.id, lastSize)}>
                      {t.upsellAdd}
                    </button>
                  </div>
                );
              })()}
              {discount > 0 && (
                <div className="cart-total cart-discount">
                  <span>{t.bundleDiscount}</span>
                  <b>−{money(discount)}</b>
                </div>
              )}
              <div className="cart-total">
                <span>{t.subtotal}</span>
                <b>{money(total - discount)}</b>
              </div>
              <p className="tiny">
                {t.cartNote}
              </p>
              {checkoutStep ? (
                <CheckoutForm
                  busy={busy}
                  subtotal={total - discount}
                  onSubmit={async (customer, shipping) => {
                    setBusy(true);
                    setError("");
                    try {
                      await onCheckout(cart, customer, shipping, cartId);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              ) : (
                <button className="buy" onClick={() => setCheckoutStep(true)}>
                  {t.toCheckout}
                  <ArrowUpRight size={20} />
                </button>
              )}
              <p role="status" className="form-status">
                {error}
              </p>
              {!live && (
                <p className="tiny">
                  {t.previewCart}
                </p>
              )}
            </>
          )}
        </Sheet>
      )}
    </I18n.Provider>
  );
}
