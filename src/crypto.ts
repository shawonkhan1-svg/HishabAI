/**
 * HishabAI zero-knowledge crypto (Web Crypto API only + BIP39 wordlist).
 *
 * Key hierarchy
 *   DEK  random 256-bit AES-GCM data key. Encrypts every record. Never leaves the device unwrapped.
 *   KEK_pw   = PBKDF2-SHA256(vault password, pw_salt,  600k iters) -> wraps DEK  (stored as wrapped_dek_pw)
 *   KEK_rec  = PBKDF2-SHA256(12-word phrase, rec_salt, 600k iters) -> wraps DEK  (stored as wrapped_dek_rec)
 *
 * Because the DEK is random and only wrapped, changing the password or recovering
 * with the phrase just re-wraps the DEK; no records need re-encrypting.
 *
 * Auth secret: Supabase Auth receives PBKDF2(email, password) under a different
 * salt, NOT your raw password, so the server can't derive the KEK from what it sees.
 */
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const rand = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export const KDF_ITERATIONS = 600_000;
export const VAULT_VERSION = 1;

export type VaultRecord = {
  vault_version: number;
  kdf_iterations: number;
  pw_salt: string;
  wrapped_dek_pw: string;
  rec_salt: string;
  wrapped_dek_rec: string;
};

export type Sealed = { ciphertext: string; iv: string };

/* ---------- base64 helpers ---------- */
export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
export function fromB64(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/* ---------- key derivation ---------- */
async function deriveKek(secret: string, salt: Uint8Array, iterations: number) {
  const base = await subtle().importKey('raw', enc.encode(secret.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

/** Value sent to Supabase Auth as the "password". One-way, salted by email. */
export async function deriveAuthSecret(email: string, password: string): Promise<string> {
  const base = await subtle().importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const salt = await subtle().digest('SHA-256', enc.encode('hishabai-auth-v1:' + email.trim().toLowerCase()));
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: KDF_ITERATIONS }, base, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- DEK wrap / unwrap ---------- */
async function wrapDek(dek: CryptoKey, kek: CryptoKey): Promise<string> {
  const iv = rand(12);
  const wrapped = new Uint8Array(await subtle().wrapKey('raw', dek, kek, { name: 'AES-GCM', iv }));
  const out = new Uint8Array(iv.length + wrapped.length);
  out.set(iv, 0);
  out.set(wrapped, iv.length);
  return toB64(out);
}

async function unwrapDek(blob: string, kek: CryptoKey, extractable = false): Promise<CryptoKey> {
  const bytes = fromB64(blob);
  return subtle().unwrapKey(
    'raw',
    bytes.slice(12),
    kek,
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/* ---------- vault lifecycle ---------- */

/** First-time setup. Returns the DEK (non-extractable), the record to store, and the one-time recovery phrase. */
export async function createVault(password: string) {
  const dekRaw = await subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const pwSalt = rand(16);
  const recSalt = rand(16);
  const recoveryPhrase = generateMnemonic(wordlist, 128); // 12 words

  const kekPw = await deriveKek(password, pwSalt, KDF_ITERATIONS);
  const kekRec = await deriveKek(recoveryPhrase, recSalt, KDF_ITERATIONS);

  const record: VaultRecord = {
    vault_version: VAULT_VERSION,
    kdf_iterations: KDF_ITERATIONS,
    pw_salt: toB64(pwSalt),
    wrapped_dek_pw: await wrapDek(dekRaw, kekPw),
    rec_salt: toB64(recSalt),
    wrapped_dek_rec: await wrapDek(dekRaw, kekRec),
  };
  // Re-import as non-extractable for day-to-day use.
  const dek = await unwrapDek(record.wrapped_dek_pw, kekPw, false);
  return { dek, record, recoveryPhrase };
}

/** Throws if the password is wrong (AES-GCM authentication fails). */
export async function unlockWithPassword(rec: VaultRecord, password: string): Promise<CryptoKey> {
  const kek = await deriveKek(password, fromB64(rec.pw_salt), rec.kdf_iterations);
  return unwrapDek(rec.wrapped_dek_pw, kek, false);
}

export function normalizePhrase(phrase: string) {
  return phrase.trim().toLowerCase().split(/\s+/).join(' ');
}
export function isValidPhrase(phrase: string) {
  return validateMnemonic(normalizePhrase(phrase), wordlist);
}

/** Unlock with the 12 words and set a new vault password. Returns new DEK + fields to update. */
export async function recoverWithPhrase(rec: VaultRecord, phrase: string, newPassword: string) {
  const p = normalizePhrase(phrase);
  if (!validateMnemonic(p, wordlist)) throw new Error('invalid-phrase');
  const kekRec = await deriveKek(p, fromB64(rec.rec_salt), rec.kdf_iterations);
  const dekRaw = await unwrapDek(rec.wrapped_dek_rec, kekRec, true);
  const pwSalt = rand(16);
  const kekPw = await deriveKek(newPassword, pwSalt, rec.kdf_iterations);
  const patch = { pw_salt: toB64(pwSalt), wrapped_dek_pw: await wrapDek(dekRaw, kekPw) };
  const dek = await unwrapDek(patch.wrapped_dek_pw, kekPw, false);
  return { dek, patch };
}

/* ---------- record encryption ---------- */
/**
 * `aad` binds the ciphertext to its owner + row id (`${userId}:${rowId}`),
 * so a malicious server can't swap blobs between rows or users undetected.
 */
export async function encryptJSON(dek: CryptoKey, data: unknown, aad: string): Promise<Sealed> {
  const iv = rand(12);
  const ct = await subtle().encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(aad) },
    dek,
    enc.encode(JSON.stringify(data))
  );
  return { ciphertext: toB64(ct), iv: toB64(iv) };
}

export async function decryptJSON<T>(dek: CryptoKey, sealed: Sealed, aad: string): Promise<T> {
  const pt = await subtle().decrypt(
    { name: 'AES-GCM', iv: fromB64(sealed.iv), additionalData: enc.encode(aad) },
    dek,
    fromB64(sealed.ciphertext)
  );
  return JSON.parse(dec.decode(pt)) as T;
}
