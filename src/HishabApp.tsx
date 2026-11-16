'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Wallet, PieChart as PieIcon, Plus, Target, ShieldCheck, List, Trash2, Eye, EyeOff,
  Download, RefreshCw, Copy, Check, LogOut, Lock,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import * as api from '@/lib/api';
import * as vault from '@/lib/crypto';
import { CATEGORIES, catOf, fmtDate, fmtMoney, makeT, type Lang } from '@/lib/i18n';
import { APP_VERSION, checkForUpdate, registerServiceWorker } from '@/lib/pwa';
import { printStatement } from '@/lib/statement';

type Stage = 'boot' | 'auth' | 'vault' | 'recovery' | 'reset' | 'app';
type VaultMode = 'setup' | 'unlock' | 'recover';
type Tab = 'home' | 'ledger' | 'add' | 'charts' | 'goal' | 'security';
type T = ReturnType<typeof makeT>;

const glass = 'rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl';
const field = 'w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500';
const primary = 'rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50';
const today = () => new Date().toISOString().slice(0, 10);

/* ============================ Auth ============================ */
function AuthScreen({ t, onAuthed }: { t: T; onAuthed: (uid: string, pw?: string) => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'register' | 'phone' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [phone, setPhone] = useState('+880');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setMsg('');
    try { await fn(); } catch (e) { setMsg(e instanceof Error && e.message ? e.message : t('error')); }
    setBusy(false);
  };

  const submitEmail = () => run(async () => {
    if (mode === 'register' && pw.length < 10) throw new Error(t('pwHint'));
    const res = mode === 'register' ? await api.signUpEmail(email, pw) : await api.signInEmail(email, pw);
    if (res.error) throw res.error;
    if (!res.data.session || !res.data.user) { setMsg(t('checkEmail')); return; }
    await onAuthed(res.data.user.id, pw);
  });

  const submitPhone = () => run(async () => {
    if (!sent) {
      const { error } = await api.sendPhoneOtp(phone.trim());
      if (error) throw error;
      setSent(true);
      return;
    }
    const { data, error } = await api.verifyPhoneOtp(phone.trim(), otp.trim());
    if (error || !data.user) throw error ?? new Error(t('error'));
    await onAuthed(data.user.id);
  });

  const submitForgot = () => run(async () => {
    const { error } = await api.sendResetEmail(email);
    if (error) throw error;
    setMsg(t('resetSent'));
  });

  return (
    <div className={`${glass} w-full max-w-md space-y-5 p-6`}>
      <div className="flex gap-1 rounded-2xl bg-slate-950/70 p-1 text-xs font-semibold">
        {(['login', 'register', 'phone'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setMsg(''); }}
            className={`flex-1 rounded-xl py-2 ${mode === m ? 'bg-emerald-400 text-slate-950' : 'text-slate-400'}`}>
            {m === 'login' ? t('login') : m === 'register' ? t('register') : t('phoneOtp')}
          </button>
        ))}
      </div>

      {mode === 'forgot' ? (
        <div className="space-y-3">
          <input className={field} type="email" autoComplete="email" placeholder={t('email')} value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <button className={`${primary} w-full`} disabled={busy || !email} onClick={submitForgot}>
            {busy ? t('working') : t('sendReset')}
          </button>
          <button className="text-xs text-slate-400" onClick={() => { setMode('login'); setMsg(''); }}>{t('back')}</button>
        </div>
      ) : mode === 'phone' ? (
        <div className="space-y-3">
          <input className={field} inputMode="tel" autoComplete="tel" placeholder={t('phone')} value={phone}
            onChange={(e) => setPhone(e.target.value)} disabled={sent} />
          {sent && <input className={field} inputMode="numeric" maxLength={6} autoComplete="one-time-code"
            placeholder={t('otp')} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />}
          <button className={`${primary} w-full`} disabled={busy} onClick={submitPhone}>
            {busy ? t('working') : sent ? t('verify') : t('sendOtp')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input className={field} type="email" autoComplete="email" placeholder={t('email')} value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <div className="relative">
            <input className={field} type={show ? 'text' : 'password'} placeholder={t('password')} value={pw}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onChange={(e) => setPw(e.target.value)} />
            <button type="button" aria-label="toggle password" onClick={() => setShow(!show)}
              className="absolute right-3 top-3 text-slate-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {mode === 'register' && <p className="text-xs text-slate-400">{t('pwHint')}</p>}
          <button className={`${primary} w-full`} disabled={busy || !email || !pw} onClick={submitEmail}>
            {busy ? t('working') : mode === 'register' ? t('register') : t('login')}
          </button>
          {mode === 'login' && (
            <button className="text-xs text-slate-400" onClick={() => { setMode('forgot'); setMsg(''); }}>{t('forgot')}</button>
          )}
        </div>
      )}
      {msg && <p role="alert" className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}

/* ============================ Vault ============================ */
function VaultScreen({ t, mode, setMode, onSetup, onUnlock, onRecover, onLogout }: {
  t: T; mode: VaultMode; setMode: (m: VaultMode) => void;
  onSetup: (pw: string) => Promise<void>; onUnlock: (pw: string) => Promise<void>;
  onRecover: (phrase: string, pw: string) => Promise<void>; onLogout: () => void;
}) {
  const [pw, setPw] = useState('');
  const [phrase, setPhrase] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setErr('');
    try {
      if (mode === 'setup') {
        if (pw.length < 10) throw new Error(t('pwHint'));
        await onSetup(pw);
      } else if (mode === 'unlock') await onUnlock(pw);
      else {
        if (pw.length < 10) throw new Error(t('pwHint'));
        await onRecover(phrase, pw);
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      setErr(mode === 'unlock' ? t('wrongPw') : mode === 'recover' ? t('badPhrase') : m || t('error'));
    }
    setBusy(false);
  };

  const title = mode === 'setup' ? t('vaultCreate') : mode === 'unlock' ? t('vaultUnlock') : t('useRecovery');
  return (
    <div className={`${glass} w-full max-w-md space-y-4 p-6`}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Lock size={18} className="text-emerald-400" />{title}</h2>
      {mode === 'setup' && <p className="text-xs text-slate-400">{t('vaultCreateDesc')}</p>}
      {mode === 'recover' && (
        <textarea className={field} rows={3} placeholder={t('recoveryPhrase')} value={phrase}
          onChange={(e) => setPhrase(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      )}
      <input className={field} type="password" autoComplete={mode === 'unlock' ? 'current-password' : 'new-password'}
        placeholder={mode === 'recover' ? t('newVaultPw') : t('password')} value={pw}
        onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
      <button className={`${primary} w-full`} disabled={busy || !pw} onClick={go}>
        {busy ? t('working') : mode === 'setup' ? t('continue') : t('unlock')}
      </button>
      {err && <p role="alert" className="text-sm text-amber-300">{err}</p>}
      <div className="flex justify-between text-xs text-slate-400">
        {mode === 'unlock' && <button onClick={() => { setMode('recover'); setErr(''); setPw(''); }}>{t('useRecovery')}</button>}
        {mode === 'recover' && <button onClick={() => { setMode('unlock'); setErr(''); setPw(''); }}>{t('vaultUnlock')}</button>}
        <button className="ml-auto" onClick={onLogout}>{t('logout')}</button>
      </div>
    </div>
  );
}

function RecoveryScreen({ t, phrase, onDone }: { t: T; phrase: string; onDone: () => void }) {
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = phrase.split(' ');
  return (
    <div className={`${glass} w-full max-w-md space-y-4 p-6`}>
      <h2 className="text-lg font-bold text-white">{t('recoveryTitle')}</h2>
      <p className="text-sm text-amber-300">{t('recoveryWarn')}</p>
      <ol className="grid grid-cols-3 gap-2 text-sm">
        {words.map((w, i) => (
          <li key={i} className="rounded-lg bg-slate-950/80 px-2 py-2 text-emerald-300">
            <span className="mr-1 text-slate-500">{i + 1}.</span>{w}
          </li>
        ))}
      </ol>
      <button className="flex items-center gap-1.5 text-xs text-slate-300"
        onClick={() => { navigator.clipboard?.writeText(phrase); setCopied(true); }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}{t('copy')}
      </button>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />{t('recoverySaved')}
      </label>
      <button className={`${primary} w-full`} disabled={!ok} onClick={onDone}>{t('continue')}</button>
    </div>
  );
}

function ResetScreen({ t, onSubmit }: { t: T; onSubmit: (phrase: string, pw: string) => Promise<void> }) {
  const [phrase, setPhrase] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    try {
      if (pw.length < 10) throw new Error(t('pwHint'));
      await onSubmit(phrase, pw);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : t('error')); }
    setBusy(false);
  };
  return (
    <div className={`${glass} w-full max-w-md space-y-4 p-6`}>
      <h2 className="text-lg font-bold text-white">{t('resetTitle')}</h2>
      <p className="text-xs text-slate-400">{t('resetDesc')}</p>
      <textarea className={field} rows={3} placeholder={t('recoveryPhrase')} value={phrase}
        onChange={(e) => setPhrase(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <input className={field} type="password" autoComplete="new-password" placeholder={t('newVaultPw')} value={pw}
        onChange={(e) => setPw(e.target.value)} />
      <button className={`${primary} w-full`} disabled={busy || !pw} onClick={go}>{busy ? t('working') : t('resetSave')}</button>
      {err && <p role="alert" className="text-sm text-amber-300">{err}</p>}
    </div>
  );
}

/* ============================ Main ============================ */
export default function HishabApp() {
  const [lang, setLangState] = useState<Lang>('bn');
  const t = useMemo(() => makeT(lang), [lang]);
  const [stage, setStage] = useState<Stage>('boot');
  const [vaultMode, setVaultMode] = useState<VaultMode>('unlock');
  const [uid, setUid] = useState('');
  const [profile, setProfile] = useState<api.Profile | null>(null);
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [rows, setRows] = useState<api.TxRow[]>([]);
  const [goal, setGoal] = useState(20000);
  const [recovery, setRecovery] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const recoveryRef = useRef(false); // true while handling a password-reset link

  /* language */
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('hishab-lang', l);
    document.documentElement.lang = l;
    if (uid && profile) api.updateProfile(uid, { lang: l }).catch(() => {});
  };

  /* session flow */
  const enterApp = useCallback(async (key: CryptoKey, userId: string, prof: api.Profile) => {
    setDek(key);
    const [loaded, s] = await Promise.all([api.loadTransactions(key, userId), api.readSettings(key, userId, prof)]);
    setRows(loaded);
    setGoal(s.goal);
    setStage('app');
  }, []);

  const setupVault = async (userId: string, pw: string) => {
    const { dek: key, record, recoveryPhrase } = await vault.createVault(pw);
    await api.insertProfile(userId, record, lang);
    const prof: api.Profile = { id: userId, lang, encrypted_settings: null, settings_iv: null, ...record };
    setProfile(prof); setDek(key); setRecovery(recoveryPhrase); setStage('recovery');
  };

  const onAuthed = useCallback(async (userId: string, pw?: string) => {
    setUid(userId);
    const prof = await api.getProfile(userId);
    if (!prof) {
      if (pw) { await setupVault(userId, pw); return; }
      setVaultMode('setup'); setStage('vault'); return;
    }
    setProfile(prof);
    if (pw) {
      try { await enterApp(await vault.unlockWithPassword(prof, pw), userId, prof); return; } catch { /* fall through to unlock screen */ }
    }
    setVaultMode('unlock'); setStage('vault');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterApp, lang]);

  useEffect(() => {
    const saved = localStorage.getItem('hishab-lang');
    if (saved === 'bn' || saved === 'en') { setLangState(saved); document.documentElement.lang = saved; }
    registerServiceWorker((apply) => setApplyUpdate(() => apply)).catch(() => {});
    if (window.location.hash.includes('type=recovery')) { recoveryRef.current = true; setStage('reset'); }
    api.supabase.auth.getSession().then(({ data }) => {
      if (recoveryRef.current) return;
      if (data.session) onAuthed(data.session.user.id).catch(() => setStage('auth'));
      else setStage('auth');
    });
    const { data: sub } = api.supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'PASSWORD_RECOVERY') { recoveryRef.current = true; setStage('reset'); }
      if (ev === 'SIGNED_OUT') { recoveryRef.current = false; setDek(null); setRows([]); setProfile(null); setStage('auth'); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lock = () => { setDek(null); setRows([]); setVaultMode('unlock'); setStage('vault'); };
  const logout = async () => { await api.signOut(); };

  // Forgot-password finish: new account password + vault re-wrapped with the recovery phrase.
  const onReset = async (phrase: string, pw: string) => {
    const { data } = await api.supabase.auth.getUser();
    const email = data.user?.email;
    const userId = data.user?.id;
    if (!email || !userId) throw new Error(t('error'));
    const prof = await api.getProfile(userId);
    let recovered: Awaited<ReturnType<typeof vault.recoverWithPhrase>> | null = null;
    if (prof) {
      try { recovered = await vault.recoverWithPhrase(prof, phrase, pw); } // fails before touching the account
      catch { throw new Error(t('badPhrase')); }
    }
    const { error } = await api.setAuthPassword(email, pw);
    if (error) throw error;
    recoveryRef.current = false;
    window.history.replaceState(null, '', window.location.pathname);
    setUid(userId);
    if (prof && recovered) {
      await api.updateProfile(userId, recovered.patch);
      const next = { ...prof, ...recovered.patch };
      setProfile(next);
      await enterApp(recovered.dek, userId, next);
    } else {
      setVaultMode('setup'); setStage('vault');
    }
  };

  /* derived data */
  const monthRows = useMemo(() => rows.filter((r) => r.tx.date.startsWith(month)), [rows, month]);
  const income = monthRows.filter((r) => r.tx.type === 'income').reduce((s, r) => s + r.tx.amount, 0);
  const spent = monthRows.filter((r) => r.tx.type === 'expense').reduce((s, r) => s + r.tx.amount, 0);
  const net = income - spent;
  const rate = income > 0 ? Math.round((net / income) * 100) : 0;
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    monthRows.filter((r) => r.tx.type === 'expense').forEach((r) => m.set(r.tx.category, (m.get(r.tx.category) ?? 0) + r.tx.amount));
    return [...m].map(([id, value]) => ({ id, name: catOf(id)[lang], value, color: catOf(id).color })).sort((a, b) => b.value - a.value);
  }, [monthRows, lang]);
  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    monthRows.filter((r) => r.tx.type === 'expense').forEach((r) => m.set(r.tx.date, (m.get(r.tx.date) ?? 0) + r.tx.amount));
    return [...m].sort().map(([d, v]) => ({ day: d.slice(8), v }));
  }, [monthRows]);
  const insight = monthRows.length === 0 ? t('insightEmpty')
    : rate >= 20 ? t('insightGood', { r: rate })
    : t('insightLow', { r: rate, c: byCat[0]?.name ?? '-' });

  /* ledger state */
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showCipher, setShowCipher] = useState(false);
  const ledger = monthRows.filter((r) =>
    (catFilter === 'all' || r.tx.category === catFilter) &&
    (r.tx.title + ' ' + r.tx.note).toLowerCase().includes(q.toLowerCase()));

  /* add form */
  const [f, setF] = useState({ type: 'expense' as 'income' | 'expense', title: '', amount: '', category: 'food', date: today(), note: '' });
  const [formErr, setFormErr] = useState('');
  const saveTx = async () => {
    const amount = Number(f.amount);
    if (!dek || !f.title.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 1e10) { setFormErr(t('error')); return; }
    try {
      const row = await api.addTransaction(dek, uid, { ...f, title: f.title.trim(), note: f.note.trim(), amount });
      setRows((r) => [row, ...r]);
      setF({ ...f, title: '', amount: '', note: '' });
      setFormErr(''); setTab('ledger');
    } catch { setFormErr(t('error')); }
  };
  const del = async (id: string) => {
    if (!window.confirm('?')) return;
    try { await api.deleteTransaction(id); setRows((r) => r.filter((x) => x.tx.id !== id)); } catch { /* keep row */ }
  };

  const exportCsv = () => {
    const safe = (v: string | number) => {
      let s = String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // block spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = ['date,type,category,title,amount,note',
      ...monthRows.map((r) => [r.tx.date, r.tx.type, catOf(r.tx.category).en, r.tx.title, r.tx.amount, r.tx.note].map(safe).join(','))];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `hishab-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => printStatement({ txs: monthRows.map((r) => r.tx), month, lang, t });

  const [goalInput, setGoalInput] = useState('');
  const saveGoal = async () => {
    const g = Number(goalInput);
    if (!dek || !Number.isFinite(g) || g <= 0) return;
    await api.saveSettings(dek, uid, { goal: g });
    setGoal(g); setGoalInput('');
  };

  const manualCheck = async () => {
    setUpdateMsg(t('working'));
    const found = await checkForUpdate();
    setUpdateMsg(found ? t('updateReady') : t('upToDate'));
  };

  /* ============================ render ============================ */
  const header = (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
      <div className="flex items-center gap-2 text-white">
        <Wallet className="text-emerald-400" size={22} />
        <div className="leading-tight">
          <div className="font-bold">{t('appName')}</div>
          <div className="text-[11px] text-slate-400">{t('tagline')}</div>
        </div>
      </div>
      <div className="flex rounded-full bg-slate-900 p-1 text-xs font-bold">
        {(['bn', 'en'] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-3 py-1 ${lang === l ? 'bg-emerald-400 text-slate-950' : 'text-slate-400'}`}>
            {l === 'bn' ? 'বাংলা' : 'English'}
          </button>
        ))}
      </div>
    </header>
  );

  const updateBanner = applyUpdate && (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
      {t('updateReady')}
      <button className="rounded-lg bg-slate-950 px-3 py-1 text-emerald-300" onClick={applyUpdate}>{t('updateNow')}</button>
    </div>
  );

  if (stage !== 'app') {
    return (
      <div className="min-h-screen">
        {updateBanner}
        {header}
        <main className="flex justify-center px-4 pb-10 pt-6">
          {stage === 'boot' && <p className="text-slate-400">{t('working')}</p>}
          {stage === 'auth' && <AuthScreen t={t} onAuthed={onAuthed} />}
          {stage === 'reset' && <ResetScreen t={t} onSubmit={onReset} />}
          {stage === 'vault' && (
            <VaultScreen t={t} mode={vaultMode} setMode={setVaultMode} onLogout={logout}
              onSetup={(pw) => setupVault(uid, pw)}
              onUnlock={async (pw) => { if (!profile) throw new Error(); await enterApp(await vault.unlockWithPassword(profile, pw), uid, profile); }}
              onRecover={async (phrase, pw) => {
                if (!profile) throw new Error();
                const { dek: key, patch } = await vault.recoverWithPhrase(profile, phrase, pw);
                await api.updateProfile(uid, patch);
                const next = { ...profile, ...patch };
                setProfile(next);
                await enterApp(key, uid, next);
              }} />
          )}
          {stage === 'recovery' && <RecoveryScreen t={t} phrase={recovery} onDone={() => { const p = profile!; setRecovery(''); enterApp(dek!, uid, p); }} />}
        </main>
      </div>
    );
  }

  const nav: { id: Tab; label: string; Icon: typeof Wallet }[] = [
    { id: 'home', label: t('home'), Icon: Wallet },
    { id: 'ledger', label: t('ledger'), Icon: List },
    { id: 'add', label: t('add'), Icon: Plus },
    { id: 'charts', label: t('charts'), Icon: PieIcon },
    { id: 'goal', label: t('goal'), Icon: Target },
    { id: 'security', label: t('security'), Icon: ShieldCheck },
  ];

  const monthPicker = <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={`${field} !w-auto`} />;

  return (
    <div className="min-h-screen pb-28">
      {updateBanner}
      {header}
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4">
        {tab === 'home' && (
          <>
            {monthPicker}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${glass} p-4`}><div className="text-xs text-slate-400">{t('income')}</div><div className="text-xl font-bold text-emerald-400">{fmtMoney(income, lang)}</div></div>
              <div className={`${glass} p-4`}><div className="text-xs text-slate-400">{t('spent')}</div><div className="text-xl font-bold text-rose-400">{fmtMoney(spent, lang)}</div></div>
              <div className={`${glass} p-4`}><div className="text-xs text-slate-400">{t('saved')}</div><div className="text-xl font-bold text-cyan-300">{fmtMoney(net, lang)}</div></div>
              <div className={`${glass} p-4`}><div className="text-xs text-slate-400">{t('rate')}</div><div className="text-xl font-bold text-white">{rate}%</div></div>
            </div>
            <div className={`${glass} p-4`}>
              <div className="mb-1 text-xs font-semibold text-emerald-400">{t('insight')}</div>
              <p className="text-sm text-slate-200">{insight}</p>
            </div>
          </>
        )}

        {tab === 'ledger' && (
          <>
            <div className="flex flex-wrap gap-2">
              {monthPicker}
              <input className={`${field} flex-1`} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
              <select className={`${field} !w-auto`} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}
              </select>
            </div>
            <button className="text-xs text-cyan-300" onClick={() => setShowCipher(!showCipher)}>{t('showCipher')}</button>
            {ledger.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('empty')}</p>}
            <ul className="space-y-2">
              {ledger.map(({ tx, ciphertext }) => (
                <li key={tx.id} className={`${glass} flex items-start gap-3 p-3`}>
                  <span className="text-xl">{catOf(tx.category).icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{tx.title}</div>
                    <div className="text-xs text-slate-400">{catOf(tx.category)[lang]} · {fmtDate(tx.date, lang)}</div>
                    {tx.note && <div className="text-xs text-slate-500">{tx.note}</div>}
                    {showCipher && <code className="mt-1 block break-all text-[10px] text-emerald-300/80">AES-GCM · {ciphertext.slice(0, 72)}…</code>}
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '−'}{fmtMoney(tx.amount, lang)}
                  </div>
                  <button aria-label="delete" onClick={() => del(tx.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'add' && (
          <div className={`${glass} space-y-3 p-5`}>
            <div className="flex gap-1 rounded-2xl bg-slate-950/70 p-1 text-sm font-semibold">
              {(['expense', 'income'] as const).map((k) => (
                <button key={k} onClick={() => setF({ ...f, type: k, category: CATEGORIES.find((c) => c.type === k)!.id })}
                  className={`flex-1 rounded-xl py-2 ${f.type === k ? (k === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950') : 'text-slate-400'}`}>
                  {k === 'expense' ? t('expense') : t('incomeT')}
                </button>
              ))}
            </div>
            <input className={field} placeholder={t('title')} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <input className={field} inputMode="decimal" placeholder={t('amount')} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^\d.]/g, '') })} />
            <select className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.filter((c) => c.type === f.type).map((c) => <option key={c.id} value={c.id}>{c.icon} {c[lang]}</option>)}
            </select>
            <input className={field} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            <input className={field} placeholder={t('note')} maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            {formErr && <p role="alert" className="text-sm text-amber-300">{formErr}</p>}
            <button className={`${primary} w-full`} onClick={saveTx}>{t('saveTx')}</button>
          </div>
        )}

        {tab === 'charts' && (
          <>
            <div className="flex items-center justify-between">
              {monthPicker}
              <div className="flex gap-4">
                <button className="flex items-center gap-1.5 text-xs text-cyan-300" onClick={exportCsv}><Download size={14} />{t('exportCsv')}</button>
                <button className="flex items-center gap-1.5 text-xs text-cyan-300" onClick={exportPdf}><Download size={14} />{t('exportPdf')}</button>
              </div>
            </div>
            <div className={`${glass} p-4`}>
              <div className="mb-2 text-sm font-semibold text-white">{t('byCategory')}</div>
              {byCat.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">{t('insightEmpty')}</p> : (
                <div className="h-60">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {byCat.map((d) => <Cell key={d.id} fill={d.color} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmtMoney(Number(v), lang)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className={`${glass} p-4`}>
              <div className="mb-2 text-sm font-semibold text-white">{t('cashflow')}</div>
              <div className="h-52">
                <ResponsiveContainer>
                  <AreaChart data={byDay}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} width={44} />
                    <Tooltip formatter={(v) => fmtMoney(Number(v), lang)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="v" stroke="#34d399" fill="#34d399" fillOpacity={0.18} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab === 'goal' && (
          <div className={`${glass} space-y-4 p-5`}>
            <h2 className="font-bold text-white">{t('goalTitle')}</h2>
            <div className="h-3 overflow-hidden rounded-full bg-slate-950">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.max(0, Math.min(100, (net / goal) * 100))}%` }} />
            </div>
            <p className="text-sm text-slate-300">{t('goalProgress', { a: fmtMoney(Math.max(net, 0), lang), b: fmtMoney(goal, lang) })}</p>
            <div className="flex gap-2">
              <input className={field} inputMode="numeric" placeholder={fmtMoney(goal, lang)} value={goalInput} onChange={(e) => setGoalInput(e.target.value.replace(/\D/g, ''))} />
              <button className={primary} onClick={saveGoal}>{t('goalSave')}</button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className={`${glass} space-y-4 p-5`}>
            <p className="text-sm text-slate-300">{t('e2eeNote')}</p>
            <div className="text-xs text-slate-400">AES-GCM-256 · PBKDF2-SHA256 · {profile?.kdf_iterations?.toLocaleString('en-US')} iter</div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm" onClick={lock}><Lock size={14} />{t('lock')}</button>
              <button className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm" onClick={logout}><LogOut size={14} />{t('logout')}</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
              <span>{t('version')}: <span className="font-mono text-emerald-400">{APP_VERSION}</span></span>
              <button className="flex items-center gap-1.5 text-cyan-300" onClick={manualCheck}><RefreshCw size={14} />{t('checkUpdate')}</button>
              {updateMsg && <span className="w-full text-slate-400">{updateMsg}</span>}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-slate-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl">
        {nav.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} aria-current={tab === id}
            className={id === 'add'
              ? '-mt-5 flex flex-col items-center gap-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-[10px] font-bold text-slate-950'
              : `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${tab === id ? 'text-emerald-400' : 'text-slate-400'}`}>
            <Icon size={18} />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}
