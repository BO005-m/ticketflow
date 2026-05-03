'use client';
import { useState } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Briefcase, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,255,176,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-3xl border border-border bg-surface/50 p-8 shadow-2xl backdrop-blur-sm md:p-12">
          <div className="mb-8 text-center">
            <h2 className="font-syne text-3xl font-bold mb-2">Créer un compte</h2>
            <p className="text-muted text-sm">Rejoignez TicketFlow pour des billets sécurisés</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Nom Complet</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent2" />
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm transition-all focus:border-accent2 focus:ring-1 focus:ring-accent2 outline-none"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent2" />
                <input
                  type="email"
                  placeholder="jean@exemple.com"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm transition-all focus:border-accent2 focus:ring-1 focus:ring-accent2 outline-none"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm transition-all focus:border-accent2 focus:ring-1 focus:ring-accent2 outline-none"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">Je suis un...</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent2" />
                <select
                  className="w-full appearance-none rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm transition-all focus:border-accent2 focus:ring-1 focus:ring-accent2 outline-none cursor-pointer"
                  value={form.role}
                  onChange={set('role')}
                >
                  <option value="buyer">Acheteur</option>
                  <option value="organizer">Organisateur</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-4 text-xs font-medium text-danger md:col-span-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent2 py-4 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 md:col-span-2 mt-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Créer un compte
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-bold text-accent2 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
