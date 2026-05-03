'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Calendar, MapPin, QrCode, ArrowRightLeft, Loader2, Ticket as TicketIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myTickets()
      .then(({ tickets }) => setTickets(tickets))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getStatusStyles = (status) => {
    switch (status) {
      case 'active': return 'bg-accent2/10 text-accent2 border-accent2/20';
      case 'used': return 'bg-muted/10 text-muted border-muted/20';
      case 'void': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-surface text-muted border-border';
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight">Mes Tickets</h1>
        <p className="mt-1 text-muted">
          Vos tickets utilisent des QR codes tournants — les captures d'écran ne fonctionneront pas.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p>Chargement de vos tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/30 p-12 text-center">
          <div className="mb-4 rounded-full bg-surface p-4 text-muted">
            <TicketIcon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun ticket</h3>
          <p className="max-w-xs text-muted mb-8">
            Vous n'avez pas encore de tickets. Parcourez les événements pour trouver votre bonheur !
          </p>
          <Link href="/dashboard" className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-black transition-all hover:opacity-90">
            Voir les événements
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface/50 p-6 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-accent/30"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-syne text-lg font-bold group-hover:text-accent transition-colors">
                    {t.event_title}
                  </h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{fmt(t.starts_at)}</span>
                  </div>
                  {t.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{t.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-text">{parseFloat(t.purchase_price).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 sm:mt-0">
                {t.status === 'active' && (
                  <>
                    <Link
                      href={`/tickets/${t.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black transition-all hover:opacity-90 sm:flex-none"
                    >
                      <QrCode className="h-4 w-4" />
                      Afficher QR
                    </Link>
                    <Link
                      href={`/tickets/${t.id}/resell`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-text transition-all hover:bg-border sm:flex-none"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Transférer
                    </Link>
                  </>
                )}
                {t.status === 'used' && (
                  <span className="text-sm font-medium text-muted">
                    Utilisé le {t.used_at ? fmt(t.used_at) : 'Date inconnue'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
