import type { Tx } from './api';
import { catOf, fmtDate, fmtMoney, makeT, type Lang } from './i18n';

type T = ReturnType<typeof makeT>;

const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Builds a printable monthly statement on the device and opens the print sheet
 * ("Save as PDF"). Using the browser's own renderer means Bangla text shows
 * correctly with no font files bundled, and nothing is sent to any server.
 */
export function printStatement({ txs, month, lang, t }: { txs: Tx[]; month: string; lang: Lang; t: T }) {
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  const income = sorted.filter((x) => x.type === 'income').reduce((s, x) => s + x.amount, 0);
  const spent = sorted.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
  const net = income - spent;
  const rate = income > 0 ? Math.round((net / income) * 100) : 0;
  const money = (n: number) => fmtMoney(n, lang);

  const monthLabel = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(month + '-01T00:00:00')
  );

  const byCat = new Map<string, number>();
  sorted.filter((x) => x.type === 'expense').forEach((x) => byCat.set(x.category, (byCat.get(x.category) ?? 0) + x.amount));
  const catRows = [...byCat]
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => `<tr><td>${esc(catOf(id)[lang])}</td><td class="r">${esc(money(v))}</td></tr>`)
    .join('');

  const txRows = sorted
    .map(
      (x) => `<tr>
        <td>${esc(fmtDate(x.date, lang))}</td>
        <td>${esc(catOf(x.category)[lang])}</td>
        <td>${esc(x.title)}${x.note ? `<div class="n">${esc(x.note)}</div>` : ''}</td>
        <td class="r ${x.type}">${x.type === 'income' ? '+' : '−'}${esc(money(x.amount))}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>HishabAI-${esc(month)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans Bengali','Nirmala UI','Kohinoor Bangla','Segoe UI',system-ui,sans-serif; color:#0f172a; font-size:12px; margin:0; }
  h1 { font-size:20px; margin:0 0 2px; }
  h2 { font-size:13px; margin:18px 0 6px; }
  .sub { color:#475569; margin-bottom:14px; }
  .kpi { display:flex; gap:8px; }
  .kpi div { flex:1; border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; }
  .kpi b { display:block; font-size:15px; margin-top:2px; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:11px; color:#475569; border-bottom:1.5px solid #0f172a; padding:5px 6px; }
  td { padding:5px 6px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
  .r { text-align:right; white-space:nowrap; }
  .income { color:#047857; } .expense { color:#be123c; }
  .n { color:#64748b; font-size:10.5px; }
  tr { break-inside: avoid; }
  .foot { margin-top:18px; color:#64748b; font-size:10.5px; }
</style></head><body>
  <h1>${esc(t('appName'))}: ${esc(t('stmtTitle'))}</h1>
  <div class="sub">${esc(monthLabel)}</div>
  <div class="kpi">
    <div>${esc(t('income'))}<b class="income">${esc(money(income))}</b></div>
    <div>${esc(t('spent'))}<b class="expense">${esc(money(spent))}</b></div>
    <div>${esc(t('saved'))}<b>${esc(money(net))}</b></div>
    <div>${esc(t('rate'))}<b>${rate}%</b></div>
  </div>
  ${catRows ? `<h2>${esc(t('byCategory'))}</h2><table>${catRows}</table>` : ''}
  <h2>${esc(t('ledger'))}</h2>
  <table>
    <thead><tr><th>${esc(t('date'))}</th><th>${esc(t('category'))}</th><th>${esc(t('title'))}</th><th class="r">${esc(t('amount'))}</th></tr></thead>
    <tbody>${txRows || `<tr><td colspan="4">${esc(t('insightEmpty'))}</td></tr>`}</tbody>
  </table>
  <div class="foot">${esc(t('stmtNote'))}</div>
</body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  const win = frame.contentWindow!;
  const cleanup = () => frame.remove();
  win.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, 5 * 60 * 1000);
  setTimeout(() => { win.focus(); win.print(); }, 300);
}
