import { createClient } from '@supabase/supabase-js';
import { deriveAuthSecret, decryptJSON, encryptJSON, type Sealed, type VaultRecord } from './crypto';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } }
);

export type Tx = {
  id: string;
  title: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
};
export type TxRow = { tx: Tx; ciphertext: string };
export type Profile = VaultRecord & { id: string; lang: 'bn' | 'en'; encrypted_settings: string | null; settings_iv: string | null };
export type Settings = { goal: number };

/* ---------- auth ---------- */
// Email: the server only ever sees a derived secret, never the raw password.
export async function signUpEmail(email: string, password: string) {
  const secret = await deriveAuthSecret(email, password);
  return supabase.auth.signUp({ email: email.trim().toLowerCase(), password: secret });
}
export async function signInEmail(email: string, password: string) {
  const secret = await deriveAuthSecret(email, password);
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: secret });
}
// Mobile: 6-digit SMS OTP (numbers like +8801XXXXXXXXX).
export const sendPhoneOtp = (phone: string) => supabase.auth.signInWithOtp({ phone });
export const verifyPhoneOtp = (phone: string, token: string) =>
  supabase.auth.verifyOtp({ phone, token, type: 'sms' });
export const signOut = () => supabase.auth.signOut();

// Forgot password: Supabase emails a link that opens the app with a short-lived session.
export const sendResetEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin });
// Sets the new account password (as the derived secret, same as sign-up).
export async function setAuthPassword(email: string, password: string) {
  const secret = await deriveAuthSecret(email, password);
  return supabase.auth.updateUser({ password: secret });
}

/* ---------- profile ---------- */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
export async function insertProfile(userId: string, rec: VaultRecord, lang: 'bn' | 'en') {
  const { error } = await supabase.from('user_profiles').insert({ id: userId, lang, ...rec });
  if (error) throw error;
}
export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId);
  if (error) throw error;
}
export async function saveSettings(dek: CryptoKey, userId: string, s: Settings) {
  const sealed = await encryptJSON(dek, s, `${userId}:settings`);
  await updateProfile(userId, { encrypted_settings: sealed.ciphertext, settings_iv: sealed.iv });
}
export async function readSettings(dek: CryptoKey, userId: string, p: Profile): Promise<Settings> {
  if (!p.encrypted_settings || !p.settings_iv) return { goal: 20000 };
  try {
    return await decryptJSON<Settings>(dek, { ciphertext: p.encrypted_settings, iv: p.settings_iv }, `${userId}:settings`);
  } catch {
    return { goal: 20000 };
  }
}

/* ---------- transactions ---------- */
export async function loadTransactions(dek: CryptoKey, userId: string): Promise<TxRow[]> {
  const rows: { id: string; ciphertext: string; iv: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('encrypted_transactions')
      .select('id, ciphertext, iv')
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const out: TxRow[] = [];
  for (const r of rows) {
    try {
      const tx = await decryptJSON<Tx>(dek, r, `${userId}:${r.id}`);
      out.push({ tx: { ...tx, id: r.id }, ciphertext: r.ciphertext });
    } catch {
      /* tampered or foreign row: skip */
    }
  }
  return out;
}

export async function addTransaction(dek: CryptoKey, userId: string, data: Omit<Tx, 'id'>): Promise<TxRow> {
  const id = crypto.randomUUID();
  const tx: Tx = { id, ...data };
  const sealed: Sealed = await encryptJSON(dek, tx, `${userId}:${id}`);
  const { error } = await supabase.from('encrypted_transactions').insert({ id, ...sealed });
  if (error) throw error;
  return { tx, ciphertext: sealed.ciphertext };
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('encrypted_transactions').delete().eq('id', id);
  if (error) throw error;
}
