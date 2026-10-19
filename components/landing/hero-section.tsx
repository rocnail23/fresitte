import Link from "next/link";
import { Sparkles, ShoppingBag, MessageCircleHeart } from "lucide-react";

export type HeroHighlight = {
  label: string;
  detail: string;
};

interface HeroSectionProps {
  highlights: HeroHighlight[];
}

export function HeroSection({ highlights }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-16 md:px-12 md:pb-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full opacity-30 mix-blend-multiply"
        >
          <defs>
            <radialGradient id="hero-blob-coral" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6464" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff6464" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-blob-leaf" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9ee04b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9ee04b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-blob-cream" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe6cb" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffe6cb" stopOpacity="0" />
            </radialGradient>
            <symbol id="hero-leaf" viewBox="0 0 64 64">
              <path
                d="M32 4c12 8 20 22 20 36 0 11-9 20-20 20S12 51 12 40C12 26 20 12 32 4Z"
                fill="#9ee04b"
                opacity="0.45"
              />
              <path
                d="M32 12c0 12-4 22-12 28"
                stroke="#6fb022"
                strokeWidth="1.5"
                fill="none"
                opacity="0.7"
              />
            </symbol>
          </defs>
          <rect width="800" height="600" fill="url(#hero-blob-cream)" />
          <circle cx="640" cy="120" r="180" fill="url(#hero-blob-coral)" />
          <circle cx="120" cy="520" r="220" fill="url(#hero-blob-leaf)" />
          <use href="#hero-leaf" x="540" y="420" width="64" height="64" />
          <use href="#hero-leaf" x="80" y="80" width="48" height="48" transform="rotate(-20 104 104)" />
          <use href="#hero-leaf" x="700" y="480" width="40" height="40" transform="rotate(35 720 500)" />
        </svg>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-3 py-1 text-xs text-primary shadow-sm backdrop-blur mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Moda infantil hecha con amor
        </div>

        <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,3fr)_2fr] lg:items-center">
          <div className="space-y-8">
            <h1 className="font-heading text-balance text-[clamp(2rem,1.5rem+2.2vw,3.5rem)] leading-[1.1] text-foreground">
              Fresitte viste la infancia con<br className="hidden sm:block" /> tonos de fresa y abrazos suaves.
            </h1>
            <p className="text-[clamp(0.95rem,0.9rem+0.3vw,1.15rem)] text-muted-foreground">
              Diseñamos colecciones cómodas y sostenibles para bebés y niños.
              Cada prenda pasa por un proceso artesanal que garantiza suavidad,
              resistencia y un empaque mágico listo para regalar.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link
                href="#catalogo"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 min-h-[44px] text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0"
              >
                <ShoppingBag className="h-5 w-5" />
                Ver catálogo
              </Link>
              <Link
                href="https://wa.me/#whatsapp"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-primary/20 bg-white/70 px-6 py-3 min-h-[44px] text-base font-semibold text-primary transition hover:-translate-y-0.5"
              >
                <MessageCircleHeart className="h-5 w-5" />
                Habla con nosotros
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur sm:px-5 sm:py-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
                    {highlight.label}
                  </dt>
                  <dd className="mt-1 text-xl font-heading text-foreground sm:text-2xl">
                    {highlight.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden h-[420px] rounded-[var(--radius-3xl)] bg-white/70 p-3 shadow-xl shadow-primary/20 sm:h-[500px] lg:block">
            <div className="absolute inset-3 rounded-[var(--radius-3xl)] bg-linear-to-b from-primary/20 via-white to-accent/20" />
            <div className="relative flex h-full flex-col justify-between rounded-[var(--radius-2xl)] border border-white/80 bg-white/80 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Colección cápsula
                </p>
                <p className="text-3xl font-heading text-foreground">
                  Fresas de primavera
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
                  <p className="text-sm font-semibold text-primary">Textiles orgánicos</p>
                  <p className="text-sm text-muted-foreground">
                    Algodón 100% certificado, hipoalergénico y suave.
                  </p>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                  <p className="text-sm font-semibold text-accent-foreground">Empaque mágico</p>
                  <p className="text-sm text-muted-foreground">
                    Cada prenda llega lista para regalar y personalizar.
                  </p>
                </div>
                <div className="rounded-2xl border border-muted px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Entrega express</p>
                  <p className="text-sm text-muted-foreground">
                    24-48h en principales ciudades de Colombia.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl bg-foreground px-5 py-4 text-background">
                <p className="text-sm uppercase tracking-[0.2em] text-background/70">
                  Destacado del mes
                </p>
                <p className="text-2xl font-heading">Vestido Gardenia</p>
                <p className="text-sm text-background/80">Tallas 3m - 5 años</p>
              </div>
            </div>
          </div>

          <div className="block lg:hidden rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg shadow-primary/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Colección cápsula
            </p>
            <p className="mt-1 font-heading text-2xl text-foreground">
              Fresas de primavera
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">Textiles orgánicos, suaves e hipoalergénicos.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">Empaque mágico listo para regalar.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">Entrega express 24-48h en principales ciudades.</span>
              </li>
            </ul>
            <Link
              href="#catalogo"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
            >
              Ver la cápsula
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}