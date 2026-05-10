import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-sm space-y-4 text-center">
        <SearchX className="text-muted-foreground mx-auto h-14 w-14" />
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">Cette page n&apos;existe pas ou a été déplacée.</p>
        <div className="flex justify-center gap-3">
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
