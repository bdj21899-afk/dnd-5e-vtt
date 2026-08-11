import { supabase } from '@/lib/supabase';
import { Character } from '@/types/dnd';

export interface CharacterRecord {
  id: string;
  name: string;
  characterData: Character;
  updatedAt: string;
}

export interface MapRecord {
  id: string;
  name: string;
  imageUrl: string | null;
  width: number;
  height: number;
  updatedAt: string;
}

// ── Characters ────────────────────────────────────────────────────────────────

export async function listCharacters(userId: string): Promise<CharacterRecord[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, character_data, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(r => ({ id: r.id, name: r.name, characterData: r.character_data as Character, updatedAt: r.updated_at }));
}

export async function saveCharacter(userId: string, id: string | null, name: string, characterData: Character): Promise<string | null> {
  if (id) {
    const { error } = await supabase.from('characters').update({ name, character_data: characterData }).eq('id', id).eq('user_id', userId);
    if (error) { console.error('saveCharacter update:', error.message); return null; }
    return id;
  } else {
    const { data, error } = await supabase.from('characters').insert({ user_id: userId, name, character_data: characterData }).select('id').single();
    if (error || !data) { console.error('saveCharacter insert:', error?.message); return null; }
    return data.id;
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  await supabase.from('characters').delete().eq('id', id);
}

// ── Maps ──────────────────────────────────────────────────────────────────────

export async function listMaps(userId: string): Promise<MapRecord[]> {
  const { data, error } = await supabase
    .from('maps')
    .select('id, name, image_url, width, height, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(r => ({ id: r.id, name: r.name, imageUrl: r.image_url, width: r.width, height: r.height, updatedAt: r.updated_at }));
}

export async function saveMap(userId: string, id: string | null, name: string, imageUrl: string | null, width: number, height: number): Promise<string | null> {
  if (id) {
    const { error } = await supabase.from('maps').update({ name, image_url: imageUrl, width, height }).eq('id', id).eq('user_id', userId);
    if (error) { console.error('saveMap update:', error.message); return null; }
    return id;
  } else {
    const { data, error } = await supabase.from('maps').insert({ user_id: userId, name, image_url: imageUrl, width, height }).select('id').single();
    if (error || !data) { console.error('saveMap insert:', error?.message); return null; }
    return data.id;
  }
}

export async function deleteMap(id: string): Promise<void> {
  await supabase.from('maps').delete().eq('id', id);
}

export async function uploadMapCanvas(sessionId: string, blob: Blob): Promise<string> {
  const path = `maps/${sessionId}/${Date.now()}.png`;
  const { error } = await supabase.storage.from('dnd-maps').upload(path, blob, { upsert: true, contentType: 'image/png' });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('dnd-maps').getPublicUrl(path);
  return data.publicUrl;
}
