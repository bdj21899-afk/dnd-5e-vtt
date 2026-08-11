import { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, MousePointer, Upload, Move, RotateCcw } from 'lucide-react';
import { Token } from '@/types/dnd';
import { uploadMapImage } from '@/lib/gameApi';

interface MapSettings { offsetX: number; offsetY: number; scale: number; }

interface Props {
  mapImage: string | null;
  tokens: Token[];
  isDM: boolean;
  playerId?: string;
  sessionId?: string;
  mapOffsetX?: number;
  mapOffsetY?: number;
  mapScale?: number;
  onMapUpload?: (url: string) => void;
  onTokensUpdate?: (tokens: Token[]) => void;
  onMapSettingsUpdate?: (s: MapSettings) => void;
}

export function MapCanvas({
  mapImage, tokens, isDM, playerId, sessionId,
  mapOffsetX = 0, mapOffsetY = 0, mapScale = 1,
  onMapUpload, onTokensUpdate, onMapSettingsUpdate
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [brightness, setBrightness] = useState(() => parseInt(localStorage.getItem('dnd_brightness') || '115'));
  const [contrast, setContrast] = useState(() => parseInt(localStorage.getItem('dnd_contrast') || '100'));
  const [isUploading, setIsUploading] = useState(false);

  const stateRef = useRef({ mapOffsetX, mapOffsetY, mapScale, isDM, onMapSettingsUpdate });
  useEffect(() => { stateRef.current = { mapOffsetX, mapOffsetY, mapScale, isDM, onMapSettingsUpdate }; });

  type DragState =
    | { type: 'pan'; startMouseX: number; startMouseY: number; startOffX: number; startOffY: number }
    | { type: 'token'; tokenId: string; domOffX: number; domOffY: number };
  const dragRef = useRef<DragState | null>(null);

  // ── Wheel zoom (non-passive) ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const { isDM, mapOffsetX, mapOffsetY, mapScale, onMapSettingsUpdate } = stateRef.current;
      if (!isDM) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      const newScale = Math.max(0.25, Math.min(6, mapScale + delta));
      onMapSettingsUpdate?.({ offsetX: mapOffsetX, offsetY: mapOffsetY, scale: newScale });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const getContainerRect = () => containerRef.current!.getBoundingClientRect();

  const screenToWorld = (sx: number, sy: number) => {
    const r = getContainerRect();
    const cx = r.width / 2, cy = r.height / 2;
    return {
      wx: (sx - cx - mapOffsetX) / mapScale + cx,
      wy: (sy - cy - mapOffsetY) / mapScale + cy,
    };
  };

  // ── Mouse events ───────────────────────────────────────────────────────────
  const handleContainerDown = (e: React.MouseEvent) => {
    const r = getContainerRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (tool === 'pan' && isDM) {
      dragRef.current = { type: 'pan', startMouseX: sx, startMouseY: sy, startOffX: mapOffsetX, startOffY: mapOffsetY };
    }
  };

  const handleTokenDown = (e: React.MouseEvent, token: Token) => {
    if (tool !== 'select') return;
    if (!isDM && token.ownerId !== playerId) return;
    const r = getContainerRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const { wx, wy } = screenToWorld(sx, sy);
    const tDomX = r.width * token.x / 100;
    const tDomY = r.height * token.y / 100;
    dragRef.current = { type: 'token', tokenId: token.id, domOffX: wx - tDomX, domOffY: wy - tDomY };
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const r = getContainerRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;

    if (dragRef.current.type === 'pan') {
      const d = dragRef.current;
      onMapSettingsUpdate?.({ offsetX: d.startOffX + (sx - d.startMouseX), offsetY: d.startOffY + (sy - d.startMouseY), scale: mapScale });
    } else if (dragRef.current.type === 'token') {
      const { wx, wy } = screenToWorld(sx, sy);
      const newX = Math.max(0, Math.min(100, ((wx - dragRef.current.domOffX) / r.width) * 100));
      const newY = Math.max(0, Math.min(100, ((wy - dragRef.current.domOffY) / r.height) * 100));
      onTokensUpdate?.(tokens.map(t => t.id === (dragRef.current as any).tokenId ? { ...t, x: newX, y: newY } : t));
    }
  };

  const handleMouseUp = () => { dragRef.current = null; };

  // ── Map upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploading(true);
    try {
      if (sessionId) {
        const url = await uploadMapImage(sessionId, file);
        onMapUpload?.(url);
      } else throw new Error('no session');
    } catch {
      const reader = new FileReader();
      reader.onload = ev => onMapUpload?.(ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally { setIsUploading(false); }
  };

  const resetView = () => onMapSettingsUpdate?.({ offsetX: 0, offsetY: 0, scale: 1 });
  const zoom = (delta: number) => onMapSettingsUpdate?.({ offsetX: mapOffsetX, offsetY: mapOffsetY, scale: Math.max(0.25, Math.min(6, mapScale + delta)) });

  const wrapperStyle: React.CSSProperties = {
    transform: `translate(${mapOffsetX}px, ${mapOffsetY}px) scale(${mapScale})`,
    transformOrigin: 'center center',
  };

  const toolBtn = (t: typeof tool, icon: React.ReactNode, label: string) => (
    <button key={t} onClick={() => setTool(t)} title={label}
      className={`px-2.5 py-1.5 flex items-center gap-1 text-[11px] transition-colors ${tool === t ? 'bg-amber-700/60 text-amber-200' : 'text-amber-700 hover:text-amber-400 hover:bg-amber-900/30'}`}>
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#06090f]">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0e1a] border-b border-amber-900/30 flex-shrink-0 min-h-[44px] flex-wrap gap-y-1">
        {isDM && (
          <>
            <label className={`flex items-center gap-1.5 cursor-pointer border text-[11px] px-2.5 py-1.5 rounded transition-colors flex-shrink-0 ${isUploading ? 'bg-amber-700/30 border-amber-700/40 text-amber-500 cursor-wait' : 'bg-amber-900/30 hover:bg-amber-800/40 border-amber-800/50 text-amber-300'}`}>
              <Upload className="w-3 h-3"/>
              {isUploading ? 'Uploading…' : 'Upload Map'}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading}/>
            </label>

            <div className="flex border border-amber-900/40 rounded overflow-hidden flex-shrink-0">
              {toolBtn('select', <MousePointer className="w-3 h-3"/>, 'Move Tokens')}
              {toolBtn('pan', <Move className="w-3 h-3"/>, 'Pan Map')}
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => zoom(-0.25)} className="w-6 h-6 flex items-center justify-center text-amber-700 hover:text-amber-400 bg-[#0d1525] border border-amber-900/40 rounded-l text-sm font-bold transition-colors">−</button>
              <span className="text-amber-700 text-[10px] font-mono bg-[#0d1525] border-y border-amber-900/40 px-1.5 h-6 flex items-center">{Math.round(mapScale * 100)}%</span>
              <button onClick={() => zoom(0.25)} className="w-6 h-6 flex items-center justify-center text-amber-700 hover:text-amber-400 bg-[#0d1525] border border-amber-900/40 rounded-r text-sm font-bold transition-colors">+</button>
            </div>

            <button onClick={resetView} title="Reset View" className="text-amber-800 hover:text-amber-500 border border-amber-900/40 hover:border-amber-700 rounded p-1 transition-colors flex-shrink-0">
              <RotateCcw className="w-3 h-3"/>
            </button>
          </>
        )}

        {/* Brightness + Contrast (all clients) */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <span className="text-amber-900/50 text-[10px]" title="Brightness">☀</span>
          <input type="range" min={50} max={200} value={brightness}
            onChange={e => { const v = +e.target.value; setBrightness(v); localStorage.setItem('dnd_brightness', String(v)); }}
            className="w-16 h-1 accent-amber-600 cursor-pointer" title={`Brightness: ${brightness}%`}/>
          <span className="text-amber-900/50 text-[10px]" title="Contrast">◑</span>
          <input type="range" min={50} max={200} value={contrast}
            onChange={e => { const v = +e.target.value; setContrast(v); localStorage.setItem('dnd_contrast', String(v)); }}
            className="w-14 h-1 accent-amber-600 cursor-pointer" title={`Contrast: ${contrast}%`}/>
        </div>

        {!mapImage && !isDM && <span className="text-amber-900/50 text-[10px] ml-1">Awaiting map from DM…</span>}
      </div>

      {/* ── Map area ── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: tool === 'pan' && isDM ? (dragRef.current?.type === 'pan' ? 'grabbing' : 'grab') : 'default' }}
        onMouseDown={handleContainerDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!mapImage && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-center"><div className="text-7xl opacity-20 mb-3">🗺</div><p className="text-xs tracking-[0.3em] text-amber-900/30">NO MAP LOADED</p></div>
          </div>
        )}

        {/* Transform wrapper */}
        <div ref={wrapperRef} className="absolute inset-0" style={wrapperStyle}>
          {mapImage && (
            <img
              src={mapImage} alt="Battle Map"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
            />
          )}

          {/* Tokens */}
          {tokens.map(token => {
            const canDrag = tool === 'select' && (isDM || token.ownerId === playerId);
            const hpPct = token.maxHp > 0 ? token.hp / token.maxHp : 1;
            const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
            return (
              <div key={token.id}
                className="absolute flex flex-col items-center select-none"
                style={{ left: `${token.x}%`, top: `${token.y}%`, transform: 'translate(-50%,-50%)', zIndex: 10, cursor: canDrag ? 'grab' : 'default', pointerEvents: tool === 'pan' ? 'none' : 'auto' }}
                onMouseDown={canDrag ? e => handleTokenDown(e, token) : undefined}
              >
                <div className="rounded-full border-2 flex items-center justify-center text-white font-bold shadow-xl"
                  style={{ width: token.size, height: token.size, backgroundColor: token.color, borderColor: token.isPC ? '#f59e0b' : '#64748b', fontSize: token.size * 0.3 }}>
                  {token.imageUrl
                    ? <img src={token.imageUrl} className="w-full h-full rounded-full object-cover"/>
                    : token.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="bg-black/80 text-white text-[9px] px-1.5 rounded mt-0.5 max-w-[80px] truncate text-center border border-white/10">{token.name}</div>
                {token.maxHp > 0 && (
                  <div className="w-10 h-1 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${hpPct * 100}%`, backgroundColor: hpColor }}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
