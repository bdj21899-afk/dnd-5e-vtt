import { supabase } from '@/lib/supabase';
import { GameSession } from '@/types/dnd';

const fromRow = (r: any): GameSession => ({
  id: r.id, name: r.name, dmName: r.dm_name,
  mapImage: r.map_image || null,
  tokens: r.tokens || [],
  fogRevealed: r.fog_revealed || [],
  initiative: r.initiative || [],
  initiativeIndex: r.initiative_index ?? -1,
  notes: r.notes || [],
  loot: r.loot || [],
  mapOffsetX: r.map_offset_x ?? 0,
  mapOffsetY: r.map_offset_y ?? 0,
  mapScale: r.map_scale ?? 1,
});

const toRow = (s: GameSession) => ({
  id: s.id, name: s.name, dm_name: s.dmName,
  // Only sync URL-based map images (not large base64 strings)
  map_image: s.mapImage?.startsWith('http') ? s.mapImage : null,
  tokens: s.tokens,
  fog_revealed: s.fogRevealed,
  initiative: s.initiative,
  initiative_index: s.initiativeIndex,
  notes: s.notes,
  loot: s.loot,
  map_offset_x: s.mapOffsetX ?? 0,
  map_offset_y: s.mapOffsetY ?? 0,
  map_scale: s.mapScale ?? 1,
});

export async function createSession(session: GameSession): Promise<void> {
  const { error } = await supabase.from('game_sessions').insert(toRow(session));
  if (error) console.error('createSession:', error.message);
}

export async function loadSession(id: string): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from('game_sessions').select('*').eq('id', id).single();
  if (error || !data) return null;
  return fromRow(data);
}

export async function saveSession(session: GameSession): Promise<void> {
  const { error } = await supabase
    .from('game_sessions').upsert(toRow(session), { onConflict: 'id' });
  if (error) console.error('saveSession:', error.message);
}

export interface SessionSummary {
  id: string; name: string; dmName: string; updatedAt: string;
}

export async function listSessionsByDM(dmName: string): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, name, dm_name, updated_at')
    .eq('dm_name', dmName)
    .order('updated_at', { ascending: false })
    .limit(6);
  if (error || !data) return [];
  return data.map(r => ({ id: r.id, name: r.name, dmName: r.dm_name, updatedAt: r.updated_at }));
}

export async function uploadMapImage(sessionId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${sessionId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('dnd-maps').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('dnd-maps').getPublicUrl(path);
  return data.publicUrl;
}
