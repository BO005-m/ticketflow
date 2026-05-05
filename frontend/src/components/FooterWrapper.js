'use client';
import { usePathname } from 'next/navigation';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Masquer le footer sur la page d'accueil pour éviter le scroll
  if (pathname === '/') return null;

  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted">
      <div className="mx-auto max-w-7xl px-4">
        <p>© {new Date().getFullYear()} TicketFlow. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
