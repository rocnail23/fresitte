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
    <section className="relative isolate overflow-hidden px-6 pb-24 pt-16 sm:px-10 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-8%] top-[-15%] h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute left-[-10%] bottom-[-20%] h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      </div>
      <div className="mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-4 py-1 text-sm text-primary shadow-sm backdrop-blur">
          <Sparkles className="h-4 w-4" />
          Moda infantil hecha con amor
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,3fr)_2fr] lg:items-center">
          <div className="space-y-8">
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Fresitte viste la infancia con tonos de fresa y abrazos suaves.
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Diseñamos colecciones cómodas y sostenibles para bebés y niños.
              Cada prenda pasa por un proceso artesanal que garantiza suavidad,
              resistencia y un empaque mágico listo para regalar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#catalogo"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <ShoppingBag className="h-5 w-5" />
                Ver catálogo
              </Link>
              <Link
                href="https://wa.me/#whatsapp"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-6 py-3 text-base font-semibold text-primary transition hover:-translate-y-0.5"
              >
                <MessageCircleHeart className="h-5 w-5" />
                Habla con nosotros
              </Link>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-3xl border border-white/60 bg-white/70 px-5 py-4 shadow-sm backdrop-blur"
                >
                  <dt className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {highlight.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-heading text-foreground">
                    {highlight.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative h-[420px] rounded-[40px] bg-white/70 p-3 shadow-xl shadow-primary/20 sm:h-[500px]">
            <div className="absolute inset-3 rounded-[32px] bg-linear-to-b from-primary/20 via-white to-accent/20" />
            <div className="relative flex h-full flex-col justify-between rounded-[32px] border border-white/70 bg-white/80 p-6">
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
        </div>
      </div>
    </section>
  );
}
