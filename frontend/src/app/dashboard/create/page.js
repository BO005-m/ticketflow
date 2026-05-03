'use client';
import { useState } from 'react';
import { api } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Ticket, Percent, Plus, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateEvent() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    starts_at: '', ends_at: '',
    total_tickets: 100, price: 0,
    resale_allowed: false, resale_markup: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: val });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.createEvent(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Échec de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="mb-10">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight">Créer un événement</h1>
        <p className="mt-1 text-muted">Remplissez les détails pour lancer votre billetterie sécurisée.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 rounded-3xl border border-border bg-surface/50 p-6 md:p-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Titre de l'événement *</label>
            <input
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              value={form.title}
              onChange={set('title')}
              required
              placeholder="Ex: Festival de Musique d'Été"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Description</label>
            <textarea
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none min-h-[120px]"
              value={form.description}
              onChange={set('description')}
              placeholder="Décrivez votre événement en quelques lignes..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Lieu</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
              <input
                className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                value={form.location}
                onChange={set('location')}
                placeholder="Ex: Stade de France, Paris"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Début *</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  type="datetime-local"
                  className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  value={form.starts_at}
                  onChange={set('starts_at')}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Fin</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  type="datetime-local"
                  className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  value={form.ends_at}
                  onChange={set('ends_at')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Nombre de places *</label>
              <div className="relative group">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  value={form.total_tickets}
                  onChange={set('total_tickets')}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Prix (€) *</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted group-focus-within:text-accent">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  value={form.price}
                  onChange={set('price')}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface/50 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent/10 p-2">
                <Percent className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Paramètres de revente</h3>
                <p className="text-xs text-muted">Contrôlez le marché secondaire</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.resale_allowed}
                onChange={set('resale_allowed')}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          {form.resale_allowed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 pt-4 border-t border-border"
            >
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                Marge maximale autorisée (%)
              </label>
              <input
                type="number"
                min="0"
                max="200"
                className="w-full rounded-2xl border border-border bg-background p-4 text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                value={form.resale_markup}
                onChange={set('resale_markup')}
                placeholder="0 = revente au prix d'achat uniquement"
              />
              <p className="text-[10px] text-muted italic px-1">
                Une marge de 0% signifie que les billets ne peuvent pas être revendus plus cher que leur prix initial.
              </p>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-danger/10 p-4 text-xs font-medium text-danger">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-2xl border border-border bg-surface py-4 text-sm font-bold text-text transition-all hover:bg-border"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Créer l'événement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
