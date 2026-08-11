import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { saveMap, listMaps, uploadMapCanvas } from '@/lib/charMapApi';
import { ArrowLeft, Save, Trash2, Download, Upload } from 'lucide-react';

type DrawTool = 'pen' | 'eraser' | 'rect' | 'circle' | 'fill' | 'line';

const PALETTE = [
  '#1a0a00','#2d1300','#3d2000','#6b3a00','#8b5e00',
  '#1a1a0a','#2a2a14','#4a3728','#6b5540','#8b7355',
  '#0a0a1a','#141428','#1e2a3d','#2a3d55','#3d5570',
  '#c8a96e','#e0c080','#f0d890','#ffffff','#000000',
  '#4a0000','#700000','#a00000','#c04040','#e06060',
  '#004400','#006600','#008800','#40a040','#60c060',
];

export default function MapBuilder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const editId = params.get('id');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#c8a96e');
  const [brushSize, setBrushSize] = useState(8);
  const [mapName, setMapName] = useState('Untitled Map');
  const [saving, setSaving] = useState(false);
  const [mapId, setMapId] = useState<string | null>(editId);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x:number;y:number}|null>(null);
  const startPos = useRef<{x:number;y:number}|null>(null);
  const snapshotRef = useRef<ImageData|null>(null);
  const W = 1200, H = 800;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(0, 0, W, H);
    // Draw grid
    ctx.strokeStyle = 'rgba(100,70,20,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }, []);

  useEffect(() => {
    initCanvas();
    if (!user || !editId) return;
    listMaps(user.id).then(ms => {
      const found = ms.find(m => m.id === editId);
      if (found && found.imageUrl) {
        setMapName(found.name);
        setMapId(found.id);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d');
          ctx?.drawImage(img, 0, 0, W, H);
        };
        img.src = found.imageUrl;
      }
    });
  }, [user, editId, initCanvas]);

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, sx: number, sy: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    const targetIdx = (Math.floor(sy) * W + Math.floor(sx)) * 4;
    const targetR = data[targetIdx], targetG = data[targetIdx+1], targetB = data[targetIdx+2];
    const fc = document.createElement('canvas').getContext('2d')!;
    fc.fillStyle = fillColor; fc.fillRect(0,0,1,1);
    const fData = fc.getImageData(0,0,1,1).data;
    const [fR,fG,fB] = [fData[0],fData[1],fData[2]];
    if (targetR===fR && targetG===fG && targetB===fB) return;
    const match = (idx: number) => data[idx]===targetR && data[idx+1]===targetG && data[idx+2]===targetB;
    const stack = [[Math.floor(sx), Math.floor(sy)]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx<0||cx>=W||cy<0||cy>=H) continue;
      const i = (cy*W+cx)*4;
      if (!match(i)) continue;
      data[i]=fR; data[i+1]=fG; data[i+2]=fB; data[i+3]=255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    if (tool === 'fill') { floodFill(ctx, pos.x, pos.y, color); return; }
    isDrawing.current = true;
    lastPos.current = pos;
    startPos.current = pos;
    snapshotRef.current = ctx.getImageData(0, 0, W, H);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize/2, 0, Math.PI*2);
      ctx.fillStyle = tool === 'eraser' ? '#1a0a00' : color;
      ctx.fill();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#1a0a00' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastPos.current = pos;
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      const sx = startPos.current!.x, sy = startPos.current!.y;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.fillStyle = color + '33';
      if (tool === 'rect') {
        ctx.beginPath();
        ctx.rect(sx, sy, pos.x-sx, pos.y-sy);
        ctx.fill(); ctx.stroke();
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x-sx)/2, ry = Math.abs(pos.y-sy)/2;
        ctx.beginPath();
        ctx.ellipse(sx+(pos.x-sx)/2, sy+(pos.y-sy)/2, rx, ry, 0, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(pos.x,pos.y); ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => { isDrawing.current = false; lastPos.current = null; };

  const clear = () => {
    if (!confirm('Clear the map? This cannot be undone.')) return;
    initCanvas();
  };

  const downloadMap = () => {
    const link = document.createElement('a');
    link.download = `${mapName}.png`;
    link.href = canvasRef.current!.toDataURL();
    link.click();
  };

  const handleSave = async () => {
    if (!user) { toast.error('Sign in to save'); return; }
    setSaving(true);
    try {
      const canvas = canvasRef.current!;
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
      const imageUrl = await uploadMapCanvas(mapId || Date.now().toString(), blob);
      const id = await saveMap(user.id, mapId, mapName, imageUrl, W, H);
      if (id) {
        setMapId(id);
        toast.success('Map saved!');
      } else {
        toast.error('Failed to save map');
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, W, H);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const TOOLS: {id: DrawTool; label: string; emoji: string}[] = [
    {id:'pen', label:'Pen', emoji:'✏️'},
    {id:'eraser', label:'Eraser', emoji:'🧹'},
    {id:'rect', label:'Rectangle', emoji:'▭'},
    {id:'circle', label:'Circle', emoji:'◯'},
    {id:'line', label:'Line', emoji:'╱'},
    {id:'fill', label:'Fill', emoji:'🪣'},
  ];

  return (
    <div className="min-h-screen bg-[#06090f] text-amber-100 flex flex-col">
      <header className="bg-[#0b0e1a] border-b border-amber-900/30 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/dashboard')} className="text-amber-800 hover:text-amber-500 transition-colors">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <span className="text-amber-600 text-xs tracking-widest font-bold">MAP BUILDER</span>
        <input value={mapName} onChange={e => setMapName(e.target.value)} className="bg-black/40 border border-amber-900/40 text-amber-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-600 w-40"/>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#0d1525] hover:bg-[#141c30] border border-amber-900/40 text-amber-700 rounded px-3 py-1.5 text-xs transition-colors">
            <Upload className="w-3 h-3"/> Import
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
          </label>
          <button onClick={downloadMap} className="flex items-center gap-1.5 bg-[#0d1525] hover:bg-[#141c30] border border-amber-900/40 text-amber-700 rounded px-3 py-1.5 text-xs transition-colors">
            <Download className="w-3 h-3"/> Export
          </button>
          <button onClick={clear} className="flex items-center gap-1.5 bg-red-900/30 hover:bg-red-800/40 border border-red-900/40 text-red-400 rounded px-3 py-1.5 text-xs transition-colors">
            <Trash2 className="w-3 h-3"/> Clear
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/>{saving ? 'Saving…' : 'SAVE'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tools sidebar */}
        <div className="w-52 bg-[#0b0e1a] border-r border-amber-900/30 p-3 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          {/* Tools */}
          <div>
            <div className="text-amber-800 text-[9px] tracking-widest uppercase mb-2">Tools</div>
            <div className="grid grid-cols-3 gap-1">
              {TOOLS.map(t => (
                <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                  className={`py-2 rounded text-lg flex flex-col items-center transition-colors ${tool === t.id ? 'bg-amber-800/50 text-amber-200' : 'bg-[#0d1525] text-amber-700 hover:bg-amber-900/20'}`}>
                  <span>{t.emoji}</span>
                  <span className="text-[8px] mt-0.5">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brush size */}
          <div>
            <div className="text-amber-800 text-[9px] tracking-widest uppercase mb-2">Brush Size: {brushSize}px</div>
            <input type="range" min={1} max={60} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-amber-600 h-1"/>
          </div>

          {/* Color picker */}
          <div>
            <div className="text-amber-800 text-[9px] tracking-widest uppercase mb-2">Color</div>
            <div className="grid grid-cols-5 gap-1 mb-2">
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded transition-transform ${color === c ? 'scale-125 ring-1 ring-amber-400' : ''}`}
                  style={{ backgroundColor: c }}/>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"/>
              <span className="text-amber-700 text-[10px] font-mono">{color}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-amber-900/30 pt-3">
            <div className="text-amber-900/50 text-[9px] space-y-1">
              <p>Grid: 40px = 5 ft</p>
              <p>Canvas: 1200×800</p>
              <p className="mt-2 text-amber-800">Tips:</p>
              <p>• Dark brown = walls</p>
              <p>• Tan/gold = floors</p>
              <p>• Dark blue = water</p>
              <p>• Green = vegetation</p>
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[#06090f] p-4 flex items-start justify-center">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="border border-amber-900/30 cursor-crosshair"
            style={{ maxWidth: '100%', touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}
