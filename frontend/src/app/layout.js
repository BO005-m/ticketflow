import { AuthProvider } from '../lib/AuthContext';
import './globals.css';
import Nav from './../components/Nav'

export const metadata = {
  title: 'TicketFlow – Billetterie Sécurisée',
  description: 'Billetterie anti-revente propulsée par des QR codes dynamiques',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-background text-text antialiased selection:bg-accent selection:text-black">
         <AuthProvider>
            <div className="relative min-h-screen flex flex-col">
              <Nav />
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t border-border py-8 text-center text-sm text-muted">
                <div className="mx-auto max-w-7xl px-4">
                  <p>© {new Date().getFullYear()} TicketFlow. Tous droits réservés.</p>
                </div>
              </footer>
            </div>
         </AuthProvider>
      </body>
    </html>
  );
}
