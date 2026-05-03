'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TicketQRPage() {
  const { id } = useParams();
  const router = useRouter();
  const [qrData, setQrData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  const fetchQR = useCallback(async () => {
    try {
      const data = await api.getTicketQR(id);
      setQrData(data.qrDataURL);
      setSecondsLeft(data.secondsLeft || 30);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    api.myTickets()
      .then(({ tickets }) => {
        const t = tickets.find(t => t.id === id);
        setTicket(t || null);
      });
    fetchQR().finally(() => setLoading(false));
  }, [id, fetchQR]);

  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          api.rotateToken(id).then(data => {
            setQrData(data.qrDataURL);
            setSecondsLeft(30);
          }).catch(() => fetchQR());
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData, id, fetchQR]);

  const pct = (secondsLeft / 30) * 100;
  const ringColor = secondsLeft > 10 ? '#3bffb0' : secondsLeft > 5 ? '#e8ff3b' : '#ff4757';

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-96 flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface/50 p-12"
          >
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-muted font-medium">Génération du QR sécurisé...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-danger/20 bg-danger/10 p-12 text-center"
          >
            <AlertCircle className="h-12 w-12 text-danger" />
            <h3 className="text-xl font-bold">Erreur de chargement</h3>
            <p className="text-sm text-danger/80">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-danger px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Réessayer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {ticket && (
              <div className="mb-8 text-center">
                <h1 className="font-syne text-2xl font-bold mb-1">{ticket.event_title}</h1>
                <p className="text-sm text-muted">
                  {new Date(ticket.starts_at).toLocaleDateString('fr-FR', {
                    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            <div className="relative w-full aspect-square max-w-[320px] rounded-[40px] border border-border bg-white p-8 shadow-2xl">
              <div className="absolute inset-0 p-4">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
                  <circle
                    cx="55" cy="55" r="52"
                    fill="none" stroke="#f1f1f1" strokeWidth="3"
                  />
                  <motion.circle
                    cx="55" cy="55" r="52"
                    fill="none" stroke={ringColor} strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - pct / 100) }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              
              <div className="relative h-full w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData}
                  alt="Ticket QR Code"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 rounded-full bg-surface px-6 py-3 border border-border">
                <RefreshCw className={`h-4 w-4 text-accent ${secondsLeft < 5 ? 'animate-spin' : ''}`} />
                <span className="text-sm font-bold tabular-nums">
                  Rotation dans <span style={{ color: ringColor }}>{secondsLeft}s</span>
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-accent/5 p-4 border border-accent/10 max-w-sm">
                <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-muted leading-relaxed">
                  Ce QR code est <span className="text-accent font-semibold">dynamique</span>. 
                  Il change automatiquement pour garantir la sécurité de votre accès. 
                  Les captures d'écran ne sont pas valides à l'entrée.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
