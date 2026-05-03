'use client';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-syne text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              L'avenir de la <br />
              <span className="text-accent italic">billetterie sécurisée</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted mb-10">
              Une plateforme révolutionnaire utilisant des QR codes dynamiques pour éliminer la fraude et la revente illégale de billets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? "/dashboard" : "/auth/register"}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-bold text-black transition-all hover:scale-105 active:scale-95"
              >
                {user ? "Accéder au Dashboard" : "Commencer maintenant"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-full border border-border bg-surface px-8 py-4 text-lg font-bold text-text transition-all hover:bg-border"
              >
                Voir les événements
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface/50 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-accent2" />}
              title="Anti-Fraude"
              description="QR codes dynamiques qui changent toutes les 30 secondes pour empêcher les captures d'écran et la fraude."
            />
            <FeatureCard
              icon={<Repeat className="h-8 w-8 text-accent" />}
              title="Revente Équitable"
              description="Système de revente intégré plafonné au prix d'achat original pour stopper le marché noir."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-blue-400" />}
              title="Accès Rapide"
              description="Validation instantanée aux entrées grâce à notre technologie de scan optimisée."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-3xl border border-border bg-background transition-colors hover:border-accent/50">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 font-syne">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
