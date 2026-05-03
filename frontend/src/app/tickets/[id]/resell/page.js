'use client';
import { useState } from 'react';
import { api } from '../../../../lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Info, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResellPage() {
  const { id } = useParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleTransfer(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.resellTicket(id, email);
      setResult('success');
    } catch (err) {
      setError(err.message || 'Échec du transfert');
    } finally {
      setLoading(false);
    }
  }

  if (result === 'success') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[40px] border border-border bg-surface/50 p-12 shadow-2xl backdrop-blur-sm"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-accent2/10 p-6">
              <CheckCircle2 className="h-16 w-16 text-accent2" />
            </div>
          </div>
          <h2 className="font-syne text-3xl font-bold mb-4">Transfert réussi !</h2>
          <p className="text-muted mb-10 leading-relaxed">
            Le ticket a été transféré avec succès à <strong className="text-text">{email}</strong>. 
            Un nouveau code QR a été généré pour le destinataire. Votre ancien code est désormais invalide.
          </p>
          <button
            className="w-full rounded-full bg-accent px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
            onClick={() => router.push('/tickets')}
          >
            Retour à mes tickets
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="mb-10">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight">Transférer le Ticket</h1>
        <p className="mt-1 text-muted">
          Transférez ce ticket à un autre utilisateur enregistré de manière sécurisée.
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          <span className="text-accent font-semibold uppercase tracking-wider block mb-1">Politique Anti-Spéculation</span>
          Le prix de transfert est plafonné au prix d'achat initial. L'organisateur contrôle les règles de revente.
        </p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
            Email du destinataire
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
            <input
              type="email"
              className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="destinataire@exemple.com"
            />
          </div>
          <p className="text-[10px] text-muted px-1 italic">
            L'utilisateur doit déjà avoir un compte TicketFlow.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-4 text-xs font-medium text-danger">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5" />
              Confirmer le transfert
            </>
          )}
        </button>
      </form>
    </div>
  );
}
