export type Lang = 'bn' | 'en';

export const CATEGORIES = [
  { id: 'salary', bn: 'মাসিক বেতন', en: 'Monthly Salary', type: 'income', color: '#10b981', icon: '💼' },
  { id: 'business', bn: 'ব্যবসা/ফ্রিল্যান্সিং', en: 'Business / Freelance', type: 'income', color: '#06b6d4', icon: '🚀' },
  { id: 'bonus', bn: 'বোনাস/অন্যান্য আয়', en: 'Bonus / Extra', type: 'income', color: '#3b82f6', icon: '🎁' },
  { id: 'rent', bn: 'বাসা ভাড়া ও ইউটিলিটি', en: 'Rent & Bills', type: 'expense', color: '#f43f5e', icon: '🏠' },
  { id: 'food', bn: 'বাজার ও খাবার', en: 'Groceries & Food', type: 'expense', color: '#f59e0b', icon: '🍲' },
  { id: 'transport', bn: 'যাতায়াত খরচ', en: 'Transport', type: 'expense', color: '#8b5cf6', icon: '🚕' },
  { id: 'family', bn: 'পরিবার ও পাঠানো টাকা', en: 'Family & Transfers', type: 'expense', color: '#ec4899', icon: '👨‍👩‍👧' },
  { id: 'shopping', bn: 'কেনাকাটা ও ব্যক্তিগত', en: 'Shopping & Personal', type: 'expense', color: '#6366f1', icon: '🛍️' },
  { id: 'medical', bn: 'চিকিৎসা ও জরুরি', en: 'Health & Emergency', type: 'expense', color: '#14b8a6', icon: '💊' },
] as const;

export const catOf = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[3];

const D = {
  appName: { bn: 'হিসাব এআই', en: 'HishabAI' },
  tagline: { bn: 'আপনার টাকার হিসাব, শুধু আপনার চোখে', en: 'Your money, readable only by you' },
  login: { bn: 'লগইন', en: 'Log in' },
  register: { bn: 'নতুন অ্যাকাউন্ট', en: 'Create account' },
  phoneOtp: { bn: 'মোবাইল OTP', en: 'Mobile OTP' },
  email: { bn: 'ইমেইল', en: 'Email' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  phone: { bn: 'মোবাইল নম্বর (+880…)', en: 'Mobile number (+880…)' },
  otp: { bn: '৬ সংখ্যার OTP', en: '6-digit OTP' },
  sendOtp: { bn: 'OTP পাঠান', en: 'Send OTP' },
  verify: { bn: 'যাচাই করুন', en: 'Verify' },
  pwHint: { bn: 'কমপক্ষে ১০ অক্ষর। এটি হারালে ১২ শব্দের রিকভারি কী লাগবে।', en: 'At least 10 characters. If lost you need your 12-word recovery key.' },
  checkEmail: { bn: 'ইমেইলে পাঠানো লিংকে নিশ্চিত করে আবার লগইন করুন।', en: 'Confirm via the email link, then log in.' },
  working: { bn: 'অপেক্ষা করুন…', en: 'Working…' },
  vaultCreate: { bn: 'ভল্ট পাসওয়ার্ড তৈরি করুন', en: 'Create your vault password' },
  vaultCreateDesc: { bn: 'এই পাসওয়ার্ড দিয়ে আপনার ডেটা ফোনেই এনক্রিপ্ট হবে।', en: 'This password encrypts your data on this device.' },
  vaultUnlock: { bn: 'ভল্ট আনলক করুন', en: 'Unlock your vault' },
  unlock: { bn: 'আনলক', en: 'Unlock' },
  wrongPw: { bn: 'পাসওয়ার্ড ভুল।', en: 'Wrong password.' },
  useRecovery: { bn: 'রিকভারি কী দিয়ে আনলক', en: 'Unlock with recovery key' },
  recoveryPhrase: { bn: '১২ শব্দের রিকভারি কী', en: '12-word recovery key' },
  newVaultPw: { bn: 'নতুন ভল্ট পাসওয়ার্ড', en: 'New vault password' },
  badPhrase: { bn: 'রিকভারি কী সঠিক নয়।', en: 'That recovery key is not valid.' },
  recoveryTitle: { bn: 'আপনার রিকভারি কী লিখে রাখুন', en: 'Write down your recovery key' },
  recoveryWarn: { bn: 'এটি আর দেখানো হবে না। কাগজে লিখে নিরাপদে রাখুন। হারালে পাসওয়ার্ড ভুলে গেলে ডেটা ফিরে পাওয়া অসম্ভব।', en: 'It will not be shown again. Keep it on paper. Without it, a forgotten password means the data is gone for good.' },
  recoverySaved: { bn: 'আমি লিখে রেখেছি', en: 'I have saved it' },
  copy: { bn: 'কপি', en: 'Copy' },
  continue: { bn: 'চালিয়ে যান', en: 'Continue' },
  home: { bn: 'হোম', en: 'Home' },
  ledger: { bn: 'খাতা', en: 'Ledger' },
  add: { bn: 'যোগ', en: 'Add' },
  charts: { bn: 'গ্রাফ', en: 'Charts' },
  goal: { bn: 'টার্গেট', en: 'Goal' },
  security: { bn: 'নিরাপত্তা', en: 'Security' },
  income: { bn: 'মোট আয়', en: 'Income' },
  spent: { bn: 'মোট খরচ', en: 'Spent' },
  saved: { bn: 'নিট সঞ্চয়', en: 'Net savings' },
  rate: { bn: 'সঞ্চয়ের হার', en: 'Savings rate' },
  insight: { bn: 'স্মার্ট পরামর্শ', en: 'Smart insight' },
  insightGood: { bn: 'দারুণ! এই মাসে আপনি আয়ের {r}% সঞ্চয় করছেন।', en: 'Nice, you are saving {r}% of your income this month.' },
  insightLow: { bn: 'সঞ্চয় {r}%। সবচেয়ে বড় খরচ: {c}। এখানে কমানো যায় কি না দেখুন।', en: 'Savings are at {r}%. Biggest cost: {c}. Look there first.' },
  insightEmpty: { bn: 'এই মাসে এখনো কোনো লেনদেন নেই।', en: 'No transactions this month yet.' },
  search: { bn: 'খুঁজুন…', en: 'Search…' },
  all: { bn: 'সব', en: 'All' },
  empty: { bn: 'কিছু নেই। ‘যোগ’ চেপে প্রথম লেনদেন লিখুন।', en: 'Nothing here. Tap Add to record your first entry.' },
  title: { bn: 'শিরোনাম', en: 'Title' },
  amount: { bn: 'টাকা (৳)', en: 'Amount (৳)' },
  category: { bn: 'ক্যাটাগরি', en: 'Category' },
  date: { bn: 'তারিখ', en: 'Date' },
  note: { bn: 'নোট', en: 'Note' },
  expense: { bn: 'খরচ', en: 'Expense' },
  incomeT: { bn: 'আয়', en: 'Income' },
  saveTx: { bn: 'এনক্রিপ্ট করে সেভ করুন', en: 'Encrypt & save' },
  showCipher: { bn: 'সার্ভারে যা আছে দেখুন', en: 'Show what the server stores' },
  byCategory: { bn: 'ক্যাটাগরি অনুযায়ী খরচ', en: 'Spending by category' },
  cashflow: { bn: 'দৈনিক খরচ', en: 'Daily spending' },
  exportCsv: { bn: 'CSV ডাউনলোড', en: 'Download CSV' },
  goalTitle: { bn: 'মাসিক সঞ্চয় টার্গেট', en: 'Monthly savings goal' },
  goalSave: { bn: 'টার্গেট সেভ', en: 'Save goal' },
  goalProgress: { bn: '{a} / {b} সঞ্চিত', en: '{a} of {b} saved' },
  lock: { bn: 'ভল্ট লক করুন', en: 'Lock vault' },
  logout: { bn: 'লগআউট', en: 'Log out' },
  version: { bn: 'অ্যাপ ভার্সন', en: 'App version' },
  checkUpdate: { bn: 'আপডেট চেক করুন', en: 'Check for update' },
  updateReady: { bn: 'নতুন ভার্সন প্রস্তুত', en: 'A new version is ready' },
  updateNow: { bn: 'এখনই আপডেট', en: 'Update now' },
  upToDate: { bn: 'আপনি সর্বশেষ ভার্সনে আছেন।', en: 'You are on the latest version.' },
  e2eeNote: { bn: 'আপনার সব তথ্য ফোনে এনক্রিপ্ট হয়ে যায়। সার্ভার ও অ্যাডমিন শুধু অর্থহীন কোড দেখে।', en: 'Everything is encrypted on your device. The server and admins only see unreadable ciphertext.' },
  error: { bn: 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।', en: 'Something went wrong. Try again.' },
  forgot: { bn: 'পাসওয়ার্ড ভুলে গেছেন?', en: 'Forgot password?' },
  back: { bn: 'ফিরে যান', en: 'Back' },
  sendReset: { bn: 'রিসেট লিংক পাঠান', en: 'Send reset link' },
  resetSent: { bn: 'ইমেইল থাকলে রিসেট লিংক পাঠানো হয়েছে। ইনবক্স দেখুন।', en: 'If that email has an account, a reset link is on its way. Check your inbox.' },
  resetTitle: { bn: 'নতুন পাসওয়ার্ড সেট করুন', en: 'Set a new password' },
  resetDesc: { bn: 'আপনার ডেটা ফিরিয়ে আনতে ১২ শব্দের রিকভারি কী ও নতুন পাসওয়ার্ড দিন। একই পাসওয়ার্ড লগইন ও ভল্ট দুটোতেই কাজ করবে।', en: 'Enter your 12-word recovery key and a new password to get your data back. The same password will be used for login and the vault.' },
  resetSave: { bn: 'পাসওয়ার্ড রিসেট করুন', en: 'Reset password' },
  exportPdf: { bn: 'PDF বিবরণী', en: 'PDF statement' },
  stmtTitle: { bn: 'মাসিক হিসাব বিবরণী', en: 'Monthly statement' },
  stmtNote: { bn: 'এই বিবরণী আপনার ডিভাইসেই তৈরি হয়েছে; কোনো সার্ভারে পাঠানো হয়নি।', en: 'Generated on your device. Nothing was sent to a server.' },
} as const;

export type Key = keyof typeof D;

export const makeT = (lang: Lang) => (k: Key, vars?: Record<string, string | number>) => {
  let s: string = D[k][lang];
  if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
  return s;
};

export const fmtMoney = (n: number, lang: Lang) =>
  '৳' + new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-BD', { maximumFractionDigits: 0 }).format(n);

export const fmtNum = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-BD').format(n);

export const fmtDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso + 'T00:00:00')
  );
