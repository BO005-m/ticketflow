'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from './../../lib/AuthContext';
import Link from 'next/link';
import { Calendar, MapPin, Plus, Ticket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.listEvents()
      .then(({ events }) => setEvents(events))
      .catch(err => setMsg({ type: 'error', text: `Erreur lors du chargement: ${err.message}` }))
      .finally(() => setLoading(false));
  }, []);

  async function buyTicket(eventId) {
    setPurchasing(eventId);
    setMsg({ type: '', text: '' });
    try {
      await api.purchaseTicket(eventId);
      setMsg({ type: 'success', text: 'Ticket acheté avec succès ! Retrouvez-le dans "Mes Tickets".' });
      // Update local count
      setEvents(events.map(ev => ev.id === eventId ? { ...ev, sold_count: ev.sold_count + 1 } : ev));
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setPurchasing(null);
    }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-syne text-3xl font-extrabold tracking-tight">Événements à venir</h1>
          <p className="mt-1 text-muted">
            Réservez vos places avec des QR codes dynamiques infalsifiables.
          </p>
        </div>
        {user && (user.role === 'organizer' || user.role === 'admin') && (
          <Link
            href="/dashboard/create"
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Créer un événement
          </Link>
        )}
      </div>

      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-8 flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium ${
              msg.type === 'success'
                ? 'border-accent2/20 bg-accent2/10 text-accent2'
                : 'border-danger/20 bg-danger/10 text-danger'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p>Chargement des événements...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/30 p-12 text-center">
          <div className="mb-4 rounded-full bg-surface p-4 text-muted">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun événement</h3>
          <p className="max-w-xs text-muted mb-8">
            Il n'y a pas encore d'événements programmés. Revenez plus tard !
          </p>
          {user?.role === 'organizer' && (
            <Link href="/dashboard/create" className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-black transition-all hover:opacity-90">
              Créer le premier événement
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev, index) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface/50 transition-all hover:border-accent/30 hover:bg-surface"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    {parseFloat(ev.price) === 0 ? 'GRATUIT' : `${parseFloat(ev.price).toFixed(2)} €`}
                  </span>
                  {ev.resale_allowed && (
                    <span className="rounded-full bg-accent2/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent2">
                      Revente Autorisée
                    </span>
                  )}
                </div>
                
                <h3 className="mb-2 font-syne text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                  {ev.title}
                </h3>
                
                <div className="mb-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="h-4 w-4" />
                    <span>{fmt(ev.starts_at)}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <MapPin className="h-4 w-4" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>

                {ev.description && (
                  <p className="mb-6 line-clamp-2 text-sm text-muted leading-relaxed">
                    {ev.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Disponibilité</span>
                    <span className="text-sm font-semibold">
                      {ev.sold_count} / {ev.total_tickets} vendus
                    </span>
                  </div>
                  <button
                    onClick={() => buyTicket(ev.id)}
                    disabled={purchasing === ev.id || parseInt(ev.sold_count) >= ev.total_tickets}
                    className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-black transition-all hover:opacity-90 disabled:opacity-30"
                  >
                    {purchasing === ev.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Ticket className="h-4 w-4" />
                        Réserver
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
