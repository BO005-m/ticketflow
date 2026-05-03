'use client';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { usePathname } from 'next/navigation';
import { LogOut, Ticket, Scan, LayoutDashboard, PlusCircle, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Nav() {
  const { user, logout } = useAuth();
  const path = usePathname();

  const isActive = (href) => path === href || path.startsWith(href + '/');

  const navLinks = [
    { href: '/dashboard', label: 'Événements', icon: LayoutDashboard, show: !!user },
    { href: '/tickets', label: 'Mes Tickets', icon: Ticket, show: !!user },
    { href: '/scan', label: 'Scanner', icon: Scan, show: user && (user.role === 'organizer' || user.role === 'admin') },
    { href: '/dashboard/create', label: 'Créer', icon: PlusCircle, show: user && (user.role === 'organizer' || user.role === 'admin') },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-90">
            <span className="font-syne text-xl font-extrabold tracking-tight">
              Ticket<span className="text-accent">Flow</span>
            </span>
          </Link>

          {user && (
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinks.filter(link => link.show).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-surface hover:text-text"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border">
                  <User className="h-4 w-4 text-muted" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold leading-none">{user.name}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-all hover:border-danger hover:text-danger"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted hover:text-text px-4 py-2 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
              >
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
