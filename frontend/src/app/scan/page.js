'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from './../../lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, StopCircle, CheckCircle2, XCircle, Clock, WifiOff, RefreshCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OFFLINE_KEY = 'tf_offline_scans';

function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); }
  catch { return []; }
}
function saveOfflineQueue(q) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); 
  const [error, setError] = useState('');
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const lastScanRef = useRef('');

  useEffect(() => {
    if (user && user.role !== 'organizer' && user.role !== 'admin' && user.role !== 'scanner') {
      router.replace('/dashboard');
    }
    setOfflineCount(getOfflineQueue().length);
  }, [user, router]);

  async function startScanner() {
    setResult(null); setError('');
    const { Html5Qrcode } = await import('html5-qrcode');
    html5QrRef.current = new Html5Qrcode('qr-reader');

    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        onScanSuccess,
        () => {} 
      );
      setScanning(true);
    } catch (err) {
      setError('Accès caméra refusé. Veuillez autoriser l\'accès à la caméra.');
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  async function onScanSuccess(rawText) {
    if (rawText === lastScanRef.current) return;
    lastScanRef.current = rawText;
    setTimeout(() => { lastScanRef.current = ''; }, 3000);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      setResult({ result: 'invalid', reason: 'Code QR non reconnu par TicketFlow' });
      return;
    }

    const { token, ticketId } = parsed;

    if (navigator.onLine) {
      try {
        const data = await api.validateTicket({ token, ticketId });
        setResult(data);
        flushOfflineQueue();
      } catch (err) {
        queueOfflineScan({ token, ticketId, scannedAt: new Date().toISOString() });
        setResult({ result: 'queued', reason: 'Erreur serveur — scan mis en file d\'attente' });
      }
    } else {
      queueOfflineScan({ token, ticketId, scannedAt: new Date().toISOString() });
      setResult({ result: 'queued', reason: 'Hors ligne — scan enregistré pour synchronisation' });
    }
  }

  function queueOfflineScan(scan) {
    const q = getOfflineQueue();
    q.push(scan);
    saveOfflineQueue(q);
    setOfflineCount(q.length);
  }

  async function flushOfflineQueue() {
    const q = getOfflineQueue();
    if (q.length === 0 || syncing) return;
    setSyncing(true);
    try {
      for (const scan of q) {
        await api.validateTicket(scan).catch(() => {});
      }
      saveOfflineQueue([]);
      setOfflineCount(0);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight mb-2">Scanner de Billets</h1>
        <p className="text-muted">Validez les entrées en scannant les QR codes dynamiques.</p>
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-border bg-surface/50 p-6 shadow-2xl backdrop-blur-sm">
        <div 
          id="qr-reader" 
          className={`overflow-hidden rounded-3xl bg-black ${scanning ? 'aspect-square' : 'h-0'}`}
        />

        {!scanning && !result && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-accent/10 p-6">
              <Camera className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Prêt à scanner ?</h3>
            <p className="max-w-xs text-sm text-muted mb-8">
              Placez le QR code au centre du cadre pour une détection automatique.
            </p>
            <button
              onClick={startScanner}
              className="flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
              <Camera className="h-5 w-5" />
              Démarrer la caméra
            </button>
          </div>
        )}

        {scanning && (
          <button
            onClick={stopScanner}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-danger px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <StopCircle className="h-5 w-5" />
            Arrêter
          </button>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex flex-col items-center justify-center py-12 text-center`}
            >
              {result.result === 'valid' && (
                <>
                  <div className="mb-6 rounded-full bg-accent2/10 p-6">
                    <CheckCircle2 className="h-16 w-16 text-accent2" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-accent2 mb-2 font-syne uppercase">Valide</h2>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{result.ticket?.owner_name}</p>
                    <p className="text-muted">{result.ticket?.event_title}</p>
                  </div>
                </>
              )}

              {result.result === 'invalid' && (
                <>
                  <div className="mb-6 rounded-full bg-danger/10 p-6">
                    <XCircle className="h-16 w-16 text-danger" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-danger mb-2 font-syne uppercase">Invalide</h2>
                  <p className="text-muted">{result.reason}</p>
                </>
              )}

              {result.result === 'queued' && (
                <>
                  <div className="mb-6 rounded-full bg-accent/10 p-6">
                    <Clock className="h-16 w-16 text-accent" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-accent mb-2 font-syne uppercase">En attente</h2>
                  <p className="text-muted px-8">{result.reason}</p>
                </>
              )}

              <button
                onClick={() => { setResult(null); if (!scanning) startScanner(); }}
                className="mt-10 rounded-full border border-border bg-background px-8 py-3 text-sm font-bold transition-all hover:bg-border"
              >
                Scan suivant
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {offlineCount > 0 && (
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-3 text-sm font-medium">
            <WifiOff className="h-5 w-5 text-accent" />
            <span>{offlineCount} scan(s) en attente de synchronisation</span>
          </div>
          <button
            onClick={flushOfflineQueue}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Sync
          </button>
        </div>
      )}

      {error && (
        <div className="mt-8 flex items-center gap-2 rounded-2xl bg-danger/10 p-4 text-xs font-medium text-danger">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}
    </div>
  );
}
