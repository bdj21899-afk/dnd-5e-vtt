import { supabase } from '@/lib/supabase';
import { GameSession, DiceRollBroadcast } from '@/types/dnd';

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
  mapBrightness: r.map_brightness ?? 115,
  mapContrast: r.map_contrast ?? 100,
  gridEnabled: r.grid_enabled ?? false,
  gridSize: r.grid_size ?? 50,
  gridOffsetX: r.grid_offset_x ?? 0,
  gridOffsetY: r.grid_offset_y ?? 0,
});

const toRow = (s: GameSession) => ({
  id: s.id, name: s.name, dm_name: s.dmName,
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
  map_brightness: s.mapBrightness ?? 115,
  map_contrast: s.mapContrast ?? 100,
  grid_enabled: s.gridEnabled ?? false,
  grid_size: s.gridSize ?? 50,
  grid_offset_x: s.gridOffsetX ?? 0,
  grid_offset_y: s.gridOffsetY ?? 0,
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

// ── Dice roll broadcast ────────────────────────────────────────────────────────

export async function broadcastDiceRoll(
  sessionId: string, playerId: string, playerName: string, die: string, result: number
): Promise<void> {
  await supabase.from('dice_rolls').insert({ session_id: sessionId, player_id: playerId, player_name: playerName, die, result });
}

export async function fetchRecentRolls(sessionId: string, since: string): Promise<DiceRollBroadcast[]> {
  const { data, error } = await supabase
    .from('dice_rolls')
    .select('*')
    .eq('session_id', sessionId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, sessionId: r.session_id, playerName: r.player_name,
    playerId: r.player_id, die: r.die, result: r.result, createdAt: r.created_at,
  }));
}
