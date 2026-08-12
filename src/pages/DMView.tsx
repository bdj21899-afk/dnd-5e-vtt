import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapCanvas } from '@/components/features/map/MapCanvas';
import { DiceRoller } from '@/components/features/dm/DiceRoller';
import { InitiativeTracker } from '@/components/features/dm/InitiativeTracker';
import { MonsterStatBlock } from '@/components/features/dm/MonsterStatBlock';
import { SceneNotes } from '@/components/features/dm/SceneNotes';
import { LootManager } from '@/components/features/dm/LootManager';
import { MapSessionPanel } from '@/components/features/dm/MonsterTokenCreator';
import { AISourceImporter } from '@/components/features/dm/AISourceImporter';
import { VoiceChat } from '@/components/features/voice/VoiceChat';
import { DiceRollOverlay } from '@/components/features/dice/DiceRollOverlay';
import { GameSession, Token, DiceRollBroadcast, MonsterData, LootItem, SceneNote } from '@/types/dnd';
import { loadSession, saveSession, fetchRecentRolls } from '@/lib/gameApi';
import { LogOut, Cloud, CloudOff, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'map',      label: '🗺',  title: 'Map & Tokens' },
  { id: 'dice',     label: '🎲',  title: 'Dice' },
  { id: 'combat',   label: '⚔️',  title: 'Combat' },
  { id: 'monsters', label: '📖',  title: 'Monsters' },
  { id: 'ai',       label: '✨',  title: 'AI Importer' },
  { id: 'notes',    label: '📜',  title: 'Notes' },
  { id: 'loot',     label: '💰',  title: 'Loot' },
];

type SaveStatus = 'saved' | 'saving' | 'error';

export default function DMView() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('map');
  const [session, setSession] = useState<GameSession | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [incomingRoll, setIncomingRoll] = useState<DiceRollBroadcast | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customMonsters, setCustomMonsters] = useState<MonsterData[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenRolls = useRef<Set<string>>(new Set());
  const rollPollSince = useRef(new Date().toISOString());

  const dmName = localStorage.getItem('dnd_dm_name') || 'DM';
  const dmId = 'dm_' + (localStorage.getItem('dnd_dm_name') || 'host').toLowerCase().replace(/\s+/g, '_');

  useEffect(() => {
    const id = localStorage.getItem('dnd_current_session');
    const role = localStorage.getItem('dnd_current_role');
    if (!id || role !== 'dm') { navigate('/'); return; }

    const local = localStorage.getItem(`dnd_session_${id}`);
    if (local) setSession(JSON.parse(local));

    loadSession(id).then(remote => {
      if (remote) {
        const pendingMap = localStorage.getItem('dnd_pending_map');
        if (pendingMap) { remote.mapImage = pendingMap; localStorage.removeItem('dnd_pending_map'); }
        setSession(remote);
        localStorage.setItem(`dnd_session_${id}`, JSON.stringify(remote));
      } else if (!local) { navigate('/'); }
    });

    const rollInterval = setInterval(async () => {
      const rolls = await fetchRecentRolls(id, rollPollSince.current);
      rollPollSince.current = new Date().toISOString();
      for (const roll of rolls) {
        if (!seenRolls.current.has(roll.id)) {
          seenRolls.current.add(roll.id);
          setIncomingRoll(roll);
          break;
        }
      }
    }, 1500);

    return () => clearInterval(rollInterval);
  }, [navigate]);

  const triggerSave = useCallback((s: GameSession) => {
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await saveSession(s); setSaveStatus('saved'); }
      catch { setSaveStatus('error'); }
    }, 800);
  }, []);

  const update = useCallback((partial: Partial<GameSession>) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(`dnd_session_${updated.id}`, JSON.stringify(updated));
      triggerSave(updated);
      return updated;
    });
  }, [triggerSave]);

  const exit = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    localStorage.removeItem('dnd_current_session');
    localStorage.removeItem('dnd_current_role');
    navigate('/dashboard');
  };

  if (!session) return (
    <div className="h-screen bg-[#06090f] flex items-center justify-center text-amber-600 text-sm">Loading session…</div>
  );

  const saveIcon = saveStatus === 'saved'
    ? <Cloud className="w-3.5 h-3.5 text-green-700"/>
    : saveStatus === 'saving'
      ? <Cloud className="w-3.5 h-3.5 text-amber-600 animate-pulse"/>
      : <CloudOff className="w-3.5 h-3.5 text-red-700"/>;

  return (
    <div className="flex flex-col h-screen bg-[#06090f] overflow-hidden">
      <DiceRollOverlay roll={incomingRoll}/>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0b0e1a] border-b border-amber-900/30 flex-shrink-0 h-11">
        <span className="text-amber-600 text-[11px] tracking-widest font-bold hidden sm:block">⚔ DUNGEON FORGE</span>
        <div className="w-px h-4 bg-amber-900/50 hidden sm:block"/>
        <span className="text-amber-300 text-sm font-medium truncate">{session.name}</span>
        <div className="ml-auto flex items-center gap-3">
          <div title={saveStatus}>{saveIcon}</div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-amber-900 text-[10px]">Code:</span>
            <span className="text-amber-500 font-mono font-bold text-sm tracking-widest">{session.id}</span>
          </div>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide tools' : 'Show tools'}
            className="text-amber-800 hover:text-amber-500 border border-amber-900/40 hover:border-amber-700 rounded p-1 transition-colors"
          >
            {sidebarOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
          </button>
          <button onClick={exit} className="text-amber-900 hover:text-amber-600 transition-colors">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — always visible, expands when sidebar collapses */}
        <div className="flex-1 overflow-hidden min-w-0">
          <MapCanvas
            mapImage={session.mapImage}
            tokens={session.tokens}
            isDM={true}
            sessionId={session.id}
            mapOffsetX={session.mapOffsetX}
            mapOffsetY={session.mapOffsetY}
            mapScale={session.mapScale}
            mapBrightness={session.mapBrightness}
            mapContrast={session.mapContrast}
            gridEnabled={session.gridEnabled}
            gridSize={session.gridSize}
            gridOffsetX={session.gridOffsetX}
            gridOffsetY={session.gridOffsetY}
            onMapUpload={url => update({ mapImage: url })}
            onTokensUpdate={tokens => update({ tokens })}
            onMapSettingsUpdate={s => update({
              mapOffsetX: s.offsetX, mapOffsetY: s.offsetY, mapScale: s.scale,
              mapBrightness: s.brightness, mapContrast: s.contrast,
              gridEnabled: s.gridEnabled, gridSize: s.gridSize,
              gridOffsetX: s.gridOffsetX, gridOffsetY: s.gridOffsetY,
            })}
          />
        </div>

        {/* Collapsible DM tools sidebar */}
        <div
          className="flex flex-col border-l border-amber-900/30 bg-[#0b0e1a] flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: sidebarOpen ? '24rem' : '0px' }}
        >
          <div className="w-96 flex flex-col h-full">
            {/* Tab bar — scrollable */}
            <div className="flex border-b border-amber-900/30 flex-shrink-0 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} title={t.title}
                  className={`flex-shrink-0 px-3 py-2.5 text-base transition-colors ${tab === t.id ? 'bg-amber-900/20 border-b-2 border-amber-600' : 'hover:bg-amber-900/10'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {tab === 'map' && (
                <MapSessionPanel
                  tokens={session.tokens}
                  sessionCode={session.id}
                  onAddPlayerToken={token => update({ tokens: [...session.tokens, token] })}
                  onRemoveToken={id => update({ tokens: session.tokens.filter(t => t.id !== id) })}
                  onUpdateToken={(id, patch) => update({ tokens: session.tokens.map(t => t.id === id ? { ...t, ...patch } : t) })}
                />
              )}
              {tab === 'dice' && <DiceRoller/>}
              {tab === 'combat' && (
                <InitiativeTracker
                  entries={session.initiative}
                  activeIndex={session.initiativeIndex}
                  onUpdate={(entries, idx) => update({ initiative: entries, initiativeIndex: idx })}
                />
              )}
              {tab === 'monsters' && (
                <MonsterStatBlock
                  extraMonsters={customMonsters}
                  onAddToken={(token: Token) => update({ tokens: [...session.tokens, token] })}
                />
              )}
              {tab === 'ai' && (
                <AISourceImporter
                  onAddMonster={(m: MonsterData) => setCustomMonsters(prev => [...prev, m])}
                  onAddLoot={(items: LootItem[]) => update({ loot: [...session.loot, ...items] })}
                  onAddNotes={(notes: SceneNote[]) => update({ notes: [...session.notes, ...notes] })}
                />
              )}
              {tab === 'notes' && <SceneNotes notes={session.notes} onUpdate={notes => update({ notes })}/>}
              {tab === 'loot' && <LootManager loot={session.loot} onUpdate={loot => update({ loot })}/>}
            </div>

            {/* Voice Chat */}
            <VoiceChat sessionId={session.id} userId={dmId} userName={dmName}/>
          </div>
        </div>
      </div>
    </div>
  );
}
