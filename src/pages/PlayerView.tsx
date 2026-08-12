import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapCanvas } from '@/components/features/map/MapCanvas';
import { CharacterSheet } from '@/components/features/player/CharacterSheet';
import { VoiceChat } from '@/components/features/voice/VoiceChat';
import { PlayerDiceRoller } from '@/components/features/dice/PlayerDiceRoller';
import { DiceRollOverlay } from '@/components/features/dice/DiceRollOverlay';
import { GameSession, DiceRollBroadcast } from '@/types/dnd';
import { loadSession, saveSession, fetchRecentRolls } from '@/lib/gameApi';
import { LogOut, Wifi, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PlayerView() {
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);
  const [connected, setConnected] = useState(true);
  const [incomingRoll, setIncomingRoll] = useState<DiceRollBroadcast | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const playerName = localStorage.getItem('dnd_player_name') || 'Adventurer';
  const playerId = localStorage.getItem('dnd_player_id') || '';
  const sessionIdRef = useRef<string | null>(null);
  const seenRolls = useRef<Set<string>>(new Set());
  const rollPollSince = useRef(new Date().toISOString());

  useEffect(() => {
    const id = localStorage.getItem('dnd_current_session');
    const role = localStorage.getItem('dnd_current_role');
    if (!id || role !== 'player') { navigate('/'); return; }
    sessionIdRef.current = id;

    const local = localStorage.getItem(`dnd_session_${id}`);
    if (local) setSession(JSON.parse(local));

    loadSession(id).then(remote => {
      if (remote) { setSession(remote); setConnected(true); }
      else if (!local) navigate('/');
    }).catch(() => setConnected(false));

    const sessionInterval = setInterval(() => {
      loadSession(id).then(remote => {
        if (remote) { setSession(remote); setConnected(true); }
        else setConnected(false);
      }).catch(() => setConnected(false));
    }, 1500);

    const rollInterval = setInterval(async () => {
      const rolls = await fetchRecentRolls(id, rollPollSince.current);
      rollPollSince.current = new Date().toISOString();
      for (const roll of rolls) {
        if (!seenRolls.current.has(roll.id) && roll.playerId !== playerId) {
          seenRolls.current.add(roll.id);
          setIncomingRoll(roll);
          break;
        }
      }
    }, 1500);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(rollInterval);
    };
  }, [navigate, playerId]);

  const updateTokens = (tokens: GameSession['tokens']) => {
    if (!session) return;
    const updated = { ...session, tokens };
    setSession(updated);
    localStorage.setItem(`dnd_session_${session.id}`, JSON.stringify(updated));
    saveSession(updated).catch(console.error);
  };

  const exit = () => {
    localStorage.removeItem('dnd_current_session');
    localStorage.removeItem('dnd_current_role');
    navigate('/');
  };

  if (!session) return (
    <div className="h-screen bg-[#06090f] flex items-center justify-center text-amber-600 text-sm">Connecting to session…</div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#06090f] overflow-hidden">
      <DiceRollOverlay roll={incomingRoll}/>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0b0e1a] border-b border-amber-900/30 flex-shrink-0 h-11">
        <span className="text-amber-600 text-[11px] tracking-widest font-bold hidden sm:block">⚔ DUNGEON FORGE</span>
        <div className="w-px h-4 bg-amber-900/50 hidden sm:block"/>
        <span className="text-amber-300 text-sm font-medium truncate">{session.name}</span>
        <div className="ml-auto flex items-center gap-3">
          <div title={connected ? 'Live sync active' : 'Connection lost'}>
            {connected ? <Wifi className="w-3.5 h-3.5 text-green-700"/> : <WifiOff className="w-3.5 h-3.5 text-red-700"/>}
          </div>
          <span className="text-amber-500 text-xs hidden sm:block">{playerName}</span>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide panel' : 'Show panel'}
            className="text-amber-800 hover:text-amber-500 border border-amber-900/40 hover:border-amber-700 rounded p-1 transition-colors"
          >
            {sidebarOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
          </button>
          <button onClick={exit} className="text-amber-900 hover:text-amber-600 transition-colors">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map — always visible */}
        <div className="flex-1 overflow-hidden min-w-0">
          <MapCanvas
            mapImage={session.mapImage}
            tokens={session.tokens}
            isDM={false}
            playerId={playerId}
            mapOffsetX={session.mapOffsetX}
            mapOffsetY={session.mapOffsetY}
            mapScale={session.mapScale}
            mapBrightness={session.mapBrightness}
            mapContrast={session.mapContrast}
            gridEnabled={session.gridEnabled}
            gridSize={session.gridSize}
            gridOffsetX={session.gridOffsetX}
            gridOffsetY={session.gridOffsetY}
            onTokensUpdate={updateTokens}
          />
        </div>

        {/* Collapsible sidebar */}
        <div
          className="flex flex-col border-l border-amber-900/30 bg-[#0b0e1a] flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: sidebarOpen ? '20rem' : '0px' }}
        >
          <div className="w-80 flex flex-col h-full">
            <div className="px-3 py-2 border-b border-amber-900/30 flex-shrink-0">
              <div className="text-amber-700 text-[10px] tracking-widest uppercase">Character Sheet</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CharacterSheet/>
            </div>

            {/* Dice roller */}
            <PlayerDiceRoller
              compact
              sessionId={session.id}
              playerId={playerId}
              playerName={playerName}
            />

            {/* Voice Chat */}
            <VoiceChat sessionId={session.id} userId={playerId || 'player_' + Date.now()} userName={playerName}/>
          </div>
        </div>
      </div>
    </div>
  );
}
