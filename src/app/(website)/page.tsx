import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Package, Star, Tv } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

const services = [
  {
    name: "Netflix",
    icon: Tv,
    category: "Streaming video",
    plans: [
      { duration: "1 mois", price: "39 DH" },
      { duration: "2 mois", price: "79 DH" },
      { duration: "3 mois", price: "119 DH" },
      { duration: "6 mois", price: "220 DH" },
    ],
  },
  {
    name: "Shahid VIP",
    icon: Tv,
    category: "Streaming video",
    plans: [
      { duration: "3 mois", price: "89 DH" },
      { duration: "6 mois", price: "149 DH" },
      { duration: "12 mois", price: "249 DH" },
    ],
  },
  {
    name: "Disney+",
    icon: Tv,
    category: "Streaming video",
    plans: [
      { duration: "1 mois", price: "39 DH" },
      { duration: "3 mois", price: "119 DH" },
      { duration: "6 mois", price: "220 DH" },
    ],
  },
  {
    name: "Prime Video",
    icon: Tv,
    category: "Streaming video",
    plans: [
      { duration: "1 mois", price: "35 DH" },
      { duration: "3 mois", price: "100 DH" },
      { duration: "6 mois", price: "199 DH" },
    ],
  },
  {
    name: "Spotify",
    icon: Music,
    category: "Musique",
    plans: [
      { duration: "1 mois", price: "39 DH" },
      { duration: "3 mois", price: "99 DH" },
      { duration: "6 mois", price: "159 DH" },
    ],
  },
];
const promotions = [
  {
    name: "Netflix + Shahid VIP + Prime Video",
    badge: "Offre populaire",
    plans: [
      { duration: "1 mois", price: "69 DH" },
      { duration: "2 mois", price: "139 DH" },
      { duration: "3 mois", price: "199 DH" },
    ],
  },
  {
    name: "Netflix + Prime Video",
    badge: "Bon plan",
    plans: [
      { duration: "1 mois", price: "55 DH" },
      { duration: "2 mois", price: "99 DH" },
      { duration: "3 mois", price: "149 DH" },
      { duration: "6 mois", price: "279 DH" },
    ],
  },
];
export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Vos abonnements streaming,{" "}
          <span className="text-primary">sans tracas</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Netflix, Shahid, Disney+, Spotify et plus — à prix imbattables.
          Profitez de vos séries et films sans vous ruiner.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href={ROUTES.contact}>Commander maintenant</Link>
        </Button>
      </section>
      {/* Promotions */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-2xl font-bold">Offres groupees</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => (
            <Card key={promo.name} className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary shrink-0" />
                    {promo.name}
                  </CardTitle>
                  <Badge variant="default" className="shrink-0">
                    {promo.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {promo.plans.map((plan) => (
                    <div
                      key={plan.duration}
                      className="bg-background rounded-lg p-2 text-center border"
                    >
                      <p className="text-xs text-muted-foreground">
                        {plan.duration}
                      </p>
                      <p className="font-bold text-primary">{plan.price}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Individual services */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Services individuels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {service.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {service.category}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {service.plans.map((plan) => (
                      <div
                        key={plan.duration}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {plan.duration}
                        </span>
                        <span className="font-semibold">{plan.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      {/* CTA */}
      <section className="text-center bg-primary/5 rounded-2xl p-6 sm:p-10 border border-primary/20 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Prêt à vous abonner ?</h2>
        <p className="text-muted-foreground">
          Contactez-nous pour passer commande ou poser vos questions.
        </p>
        <Button asChild>
          <Link href={ROUTES.contact}>Nous contacter</Link>
        </Button>
      </section>
    </div>
  );
}
