import { ShieldCheck, Leaf, Gift, Truck } from "lucide-react";

const valueProps = [
  {
    icon: ShieldCheck,
    title: "Tela segura",
    description: "Algodón orgánico certificado, libre de químicos agresivos para la piel.",
  },
  {
    icon: Leaf,
    title: "Producción consciente",
    description: "Colecciones limitadas fabricadas en talleres liderados por mamás emprendedoras.",
  },
  {
    icon: Gift,
    title: "Empaque listo para regalar",
    description: "Notas personalizadas, stickers y aroma suave a vainilla.",
  },
  {
    icon: Truck,
    title: "Envío express",
    description: "Cobertura nacional con logística aliada y seguimiento en tiempo real.",
  },
];

export function ValuePropsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-lg shadow-primary/10 backdrop-blur">
        <div className="grid gap-6 md:grid-cols-2">
          {valueProps.map((item) => (
            <article
              key={item.title}
              className="flex gap-4 rounded-3xl border border-border/60 bg-background/60 p-5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
