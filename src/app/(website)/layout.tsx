import { WebsiteHeader } from '@/components/website/website-header';

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} StreamManager — Tous droits reserves
      </footer>
    </div>
  );
}
