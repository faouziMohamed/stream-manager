import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <SearchX className="h-14 w-14 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="default">
            <Link href={ROUTES.home}>Accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.console.root}>Console</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
