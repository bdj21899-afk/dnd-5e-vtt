import { useState, useCallback, useEffect } from 'react';
import { GameSession } from '@/types/dnd';

export function useSession() {
  const sessionId = localStorage.getItem('dnd_current_session') || '';
  const role = localStorage.getItem('dnd_current_role') || '';
  const key = `dnd_session_${sessionId}`;

  const load = (): GameSession | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };

  const [session, setSession] = useState<GameSession | null>(load);

  const update = useCallback((partial: Partial<GameSession>) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  // Poll for DM changes when viewing as player
  useEffect(() => {
    if (role !== 'player') return;
    const interval = setInterval(() => {
      setSession(load());
    }, 2000);
    return () => clearInterval(interval);
  }, [key, role]);

  return { session, update, sessionId, role };
}
