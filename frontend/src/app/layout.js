import { AuthProvider } from '../lib/AuthContext';
import './globals.css';
import Nav from './../components/Nav';
import FooterWrapper from './../components/FooterWrapper';

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
              <FooterWrapper />
            </div>
         </AuthProvider>
      </body>
    </html>
  );
}
