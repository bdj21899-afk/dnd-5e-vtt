import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
  };
}

export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyOtpAndSetPassword(email: string, token: string, password: string, username: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({ password, data: { username } });
  if (updateError) throw updateError;
  return updateData.user!;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
