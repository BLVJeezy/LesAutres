"use client";
import dynamic from "next/dynamic";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import {
  Component,
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
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
  MoveHorizontal,
} from "lucide-react";
import {
  colors,
  sizes,
  price,
  money,
  availability,
  addItem,
  type Size,
  type CartItem,
} from "@/lib/catalog";
import { onSubscribe, onCheckout, trackEvent } from "@/lib/integrations";
import { ShirtFallback } from "./shirt-fallback";
import { ShotCarousel } from "./shot-carousel";
const Scene = dynamic(() => import("./scene"), { ssr: false });
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
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
            "Check je inbox. Bevestig je inschrijving via de link in onze e-mail.",
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
const heroCommon = { alt: "", fill: true, priority: true, sizes: "100vw" };
const {
  props: { srcSet: heroDesktopSrcSet },
} = getImageProps({ ...heroCommon, src: "/images/hero-sunset-wide.jpg" });
const heroDesktop = { srcSet: heroDesktopSrcSet };
const { props: heroMobile } = getImageProps({
  ...heroCommon,
  src: "/images/hero-sunset.jpg",
});
const photos = [
  {
    src: "/images/perspective-street.jpg",
    alt: "Man in de Baddies Tee tegen een roestige stalen pilaar op een bouwwerf",
  },
  {
    src: "/images/perspective-drop.jpg",
    alt: "Chromen DROP 001 letters met de Baddies Tee erin weerspiegeld",
  },
  {
    src: "/images/perspective-print.jpg",
    alt: "Close-up van de BADDIES IN BELGICA print",
  },
];
export default function Store() {
  const [shirtReady, setShirtReady] = useState(false);
  const color = colors[0];
  const [productView, setProductView] = useState<"photo" | "360">("photo");
  const [size, setSize] = useState<Size>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sheet, setSheet] = useState<"cart" | "sizes" | "waitlist" | null>(
    null,
  );
  const [waitSize, setWaitSize] = useState<Size>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState<string | null>("loading");
  const [webgl, setWebgl] = useState(false);
  const [shirtFailed, setShirtFailed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reduced = useReducedMotion();
  const viewer = useRef<HTMLDivElement>(null);
  const productVisible = useInView(viewer, { margin: "250px", once: true });
  const productOnscreen = useInView(viewer);
  const stock = size ? availability(color.id, size) : null;
  useEffect(() => {
    setConsent(localStorage.getItem("la-consent"));
    try {
      const raw = JSON.parse(localStorage.getItem("la-cart") || "[]");
      if (Array.isArray(raw))
        setCart(
          raw
            .filter(
              (i: CartItem) =>
                colors.some((c) => c.id === i.color) &&
                sizes.includes(i.size) &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0,
            )
            .reduce((acc: CartItem[], i: CartItem) => addItem(acc, i), []),
        );
    } catch {}
    setLoaded(true);
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    setWebgl(!!gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
  const total = count * price;
  function add() {
    if (!size) return;
    setCart((previous) =>
      addItem(previous, { color: color.id, size, quantity: 1 }),
    );
    trackEvent("add_to_cart", { color: color.id, size });
    setError("");
    setSheet("cart");
  }
  function chooseSize(s: Size) {
    if (availability(color.id, s).kind === "soldout") {
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
        {!size
          ? "KIES JE MAAT"
          : stock?.kind === "preorder"
            ? "PRE-ORDER"
            : "IN WINKELMAND"}
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
        <section className="hero-section">
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
            <picture>
              <source
                media="(min-width: 701px)"
                srcSet={heroDesktop.srcSet}
                sizes="100vw"
              />
              <img {...heroMobile} alt="" />
            </picture>
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
            <span>LES AUTRES — IN THE STREETS</span>
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
          <div className="editorial-foot">
            <span className="micro">SAME STREETS. DIFFERENT STORIES.</span>
            <span className="tiny">Sfeerbeelden · campagne volgt</span>
          </div>
        </section>
        <section id="drop" className="product-section">
          <div
            className={`product-stage ${productView === "photo" ? "photo-mode" : "view-360"}`}
            ref={viewer}
          >
            <div className="stage-label">
              <span className="micro">THE FIRST CHAPTER</span>
              <span className="edition">001</span>
            </div>
            <div className="product-render">
              {productView === "360" &&
              webgl &&
              !shirtFailed &&
              productVisible ? (
                <>
                  {!shirtReady && (
                    <div className="render-placeholder">
                      <ShirtFallback color={color} />
                    </div>
                  )}
                  <SceneBoundary fallback={<ShirtFallback color={color} />}>
                    <Scene
                      mode="shirt"
                      active={productOnscreen}
                      onReady={() => setShirtReady(true)}
                      color={color}
                      reduced={!!reduced}
                      onInteract={() => setTouched(true)}
                      onFail={() => setShirtFailed(true)}
                    />
                  </SceneBoundary>
                </>
              ) : (
                <Image
                  className="official-product-photo"
                  src="/images/drop-001-product.jpeg"
                  alt="The Baddies Tee — off-white T-shirt met roze BADDIES en zwarte IN BELGICA, HOLLANDA, FRANSA, ESPAGNA print"
                  width={1085}
                  height={992}
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              )}
            </div>
            <div className="viewer-foot">
              <span className="micro">240 GSM · 100% COTTON</span>
              {webgl && !shirtFailed && (
                <button
                  className="view-toggle"
                  onClick={() => {
                    setProductView(productView === "photo" ? "360" : "photo");
                    setShirtReady(false);
                  }}
                >
                  <RotateCcw size={15} />
                  {productView === "photo" ? "360° BEKIJKEN" : "FOTO BEKIJKEN"}
                </button>
              )}
            </div>
            {productView === "360" && !touched && !shirtFailed && (
              <span className="rotation-caption">
                <MoveHorizontal size={14} /> SLEEP OM TE DRAAIEN
              </span>
            )}
          </div>
          <div className="product-info">
            <div className="drop-label">
              <span className="pink-dot" /> DROP 001{" "}
              <span>· LIMITED EDITION</span>
            </div>
            <h2>
              THE BADDIES<br />
              {" "}TEE
            </h2>
            <div className="price-row">
              <span>{money(price)}</span>
              <span>BOX FIT. BIG ENERGY.</span>
            </div>
            <p className="description">
              Geen grenzen. Geen uitleg nodig.
              <br />
              Eén statement, vier landen. Voor de anderen.
            </p>
            <p className="preview-note">PREVIEW · voorbeeldprijs & voorraad</p>
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
                  aria-label={
                    availability(color.id, s).kind === "soldout"
                      ? `${s}, uitverkocht, meld me aan`
                      : s
                  }
                  className={`${s === size ? "selected" : ""} ${availability(color.id, s).kind === "soldout" ? "soldout" : ""}`}
                  onClick={() => chooseSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="stock-line" aria-live="polite">
              {stock?.kind === "preorder" ? (
                <>Pre-order · {stock.shipping}</>
              ) : stock && stock.quantity <= 3 ? (
                <>
                  <span className="pink-dot" /> Nog {stock.quantity} in deze
                  maat · voorbeeldvoorraad
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
              <b>Bancontact</b>
              <span>Apple Pay</span>
              <span>G Pay</span>
              <b>VISA</b>
              <span>mastercard</span>
            </div>
            <p className="tiny delivery">
              Levertijd wordt bevestigd bij lancering. Betalen is nog niet
              actief.
            </p>
            <div className="accordions">
              {[
                {
                  title: "MATERIAAL & PASVORM",
                  body: "100% katoen. 240 GSM. Een stevige, zachte stof met een boxy, oversized pasvorm. Brede schouders, ruime mouwen en een rechte zoom.",
                },
                {
                  title: "VERZENDING & RETOUR",
                  body: "Verzending vanuit België. Verzendkosten en levertijd verschijnen vóór betaling. Je kunt binnen 14 dagen na ontvangst je herroeping melden. Pre-orders krijgen vóór de lancering een bevestigde verzenddatum.",
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
            <button onClick={() => setConsent(null)}>Cookies</button>
          </div>
          <span>BELGIUM, WORLDWIDE.</span>
        </div>
        <p className="business-note">
          Preview — handelsnaam, adres, contact en ondernemingsnummer worden
          vóór de lancering ingevuld.
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
            <b>THE BADDIES TEE</b>
            <span>
              {color.name}
              {size ? ` / ${size}` : ""}
            </span>
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
              <Link href="/privacy">Meer info</Link>
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
          <div className="size-guide">
            <span>XS — XXL</span>
            <h3>ROOM TO BE YOU.</h3>
            <p>
              De definitieve borstbreedte en lengte per maat worden na de
              productiesample toegevoegd. We tonen geen onbevestigde afmetingen.
            </p>
          </div>
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
                  const c = colors.find((c) => c.id === item.color)!;
                  const status = availability(item.color, item.size);
                  return (
                    <div
                      className="cart-item"
                      key={`${item.color}-${item.size}`}
                    >
                      <div className="cart-thumb">
                        <ShirtFallback color={c} />
                      </div>
                      <div>
                        <b>THE BADDIES TEE</b>
                        <p>
                          {c.name} / {item.size}
                        </p>
                        <strong>{money(price * item.quantity)}</strong>
                        {status.kind === "preorder" && (
                          <p className="preorder-note">
                            PRE-ORDER — {status.shipping}
                          </p>
                        )}
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
                            disabled={item.quantity >= status.quantity}
                            aria-label={`Verhoog ${item.size}`}
                            onClick={() =>
                              setCart(addItem(cart, { ...item, quantity: 1 }))
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        aria-label={`Verwijder ${c.name}, ${item.size}`}
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
                Inclusief btw · verzendkosten worden vóór betaling getoond.
              </p>
              <button
                className="buy"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await onCheckout(cart);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "EVEN GEDULD…" : "NAAR CHECKOUT"}
                <ArrowUpRight size={20} />
              </button>
              <p role="status" className="form-status">
                {error}
              </p>
              <p className="tiny">
                Preview: er wordt geen bestelling geplaatst of betaling
                uitgevoerd.
              </p>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
