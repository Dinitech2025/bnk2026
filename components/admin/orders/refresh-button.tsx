'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();

  const handleRefresh = async (isAuto = false) => {
    setIsRefreshing(true);
    console.log(`🔄 ${isAuto ? 'Auto' : 'Manuel'} - Actualisation des commandes...`);
    
    try {
      // Forcer le rafraîchissement de la page
      router.refresh();
      
      // Reset le countdown
      setCountdown(30);
      
      // Animation plus courte pour auto-refresh
      setTimeout(() => {
        setIsRefreshing(false);
      }, isAuto ? 500 : 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    if (autoRefresh && !isRefreshing) {
      // Countdown
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleRefresh(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-refresh principal
      interval = setInterval(() => {
        if (!document.hidden) { // Ne pas actualiser si l'onglet n'est pas visible
          handleRefresh(true);
        }
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [autoRefresh, isRefreshing]);

  // Actualiser quand l'utilisateur revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        handleRefresh(true);
      }
    };

    const handleFocus = () => {
      if (autoRefresh) {
        handleRefresh(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoRefresh]);

  return (
    <div className="flex items-center gap-2">
      {/* Indicateur d'auto-refresh */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full transition-colors ${autoRefresh ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        {autoRefresh && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {countdown}s
          </span>
        )}
      </div>

      {/* Toggle Auto-refresh */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAutoRefresh(!autoRefresh)}
        className="text-xs px-2 py-1 h-auto"
        title={autoRefresh ? 'Désactiver l\'auto-refresh' : 'Activer l\'auto-refresh'}
      >
        Auto
      </Button>

      {/* Bouton refresh manuel */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRefresh(false)}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Actualisation...' : 'Actualiser'}
      </Button>
    </div>
  );
}

