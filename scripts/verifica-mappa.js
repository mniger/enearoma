// Controllo della mappa di «Dove siamo» col MCP Playwright: browser_run_code_unsafe con
// filename sito/scripts/verifica-mappa.js, a sito costruito e servito da `pnpm preview` (4321).
// Per ogni larghezza e lingua: i nomi e i segni visibili non si sovrappongono e restano dentro
// il riquadro (poligoni veri, con le rotazioni); foto della mappa in .playwright-mcp/mappa/.
async (page) => {
  const ctx = page.context();
  const tab = await ctx.newPage();
  const res = [];
  for (const w of [320, 360, 390, 430, 640, 768, 1023, 1024, 1280, 1440]) {
    await tab.setViewportSize({ width: w, height: 900 });
    for (const lingua of ['', 'en/']) {
      await tab.goto(`http://localhost:4321/${lingua}#dove`);
      await tab.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
      await tab.evaluate(() => document.fonts.ready);
      const quadro = tab.locator('.mappa__quadro');
      await quadro.scrollIntoViewIfNeeded();
      await tab.waitForTimeout(250);
      const esito = await tab.evaluate(() => {
        const q = document.querySelector('.mappa__quadro');
        const carta = [...q.querySelectorAll('.carta')].find((c) => getComputedStyle(c).display !== 'none');
        const r0 = carta.getBoundingClientRect();
        const pezzi = [];
        for (const el of carta.querySelectorAll('.carta__segni > svg > *')) {
          const svg = el.parentElement;
          if (getComputedStyle(svg).display === 'none') continue;
          const b = el.getBBox();
          // dei testi conta la riga delle maiuscole (alte .7em sulla linea di base), non l'ascendente del font
          if (el.tagName === 'text') {
            const fs = parseFloat(getComputedStyle(el).fontSize);
            const base = b.y + 0.976 * fs;
            b.y = base - 0.7 * fs; b.height = 0.7 * fs;
          }
          const m = el.getScreenCTM();
          const pt = (x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
          const poli = [pt(b.x, b.y), pt(b.x + b.width, b.y), pt(b.x + b.width, b.y + b.height), pt(b.x, b.y + b.height)];
          pezzi.push({ nome: (el.textContent || el.getAttribute('class') || el.tagName).trim().slice(0, 24), poli, svg });
        }
        const sep = (a, b) => {
          for (const P of [a, b]) for (let i = 0; i < 4; i++) {
            const p1 = P[i], p2 = P[(i + 1) % 4];
            const nx = p1.y - p2.y, ny = p2.x - p1.x;
            const pa = a.map((p) => nx * p.x + ny * p.y), pb = b.map((p) => nx * p.x + ny * p.y);
            if (Math.max(...pa) <= Math.min(...pb) + 0.01 || Math.max(...pb) <= Math.min(...pa) + 0.01) return true;
          }
          return false;
        };
        const problemi = [];
        for (let i = 0; i < pezzi.length; i++) {
          const a = pezzi[i];
          if (a.poli.some((p) => p.x < r0.left - 0.5 || p.x > r0.right + 0.5 || p.y < r0.top - 0.5 || p.y > r0.bottom + 0.5)) problemi.push(`fuori: ${a.nome}`);
          for (let j = i + 1; j < pezzi.length; j++) {
            const b = pezzi[j];
            if (a.svg === b.svg) continue;  // i cerchi del segnaposto stanno uno dentro l'altro
            if (!sep(a.poli, b.poli)) problemi.push(`${a.nome} × ${b.nome}`);
          }
        }
        const corpo = [...carta.querySelectorAll('.carta__segni text')].filter((t) => getComputedStyle(t.parentElement).display !== 'none' && !t.classList.contains('metro-m')).map((t) => parseFloat(getComputedStyle(t).fontSize));
        return { variante: carta.getAttribute('class'), largo: Math.round(r0.width), visibili: pezzi.length, corpoMin: Math.min(...corpo), problemi };
      });
      const file = `.playwright-mcp/mappa/${w}${lingua ? '-en' : ''}.png`;
      await tab.locator('.mappa').screenshot({ path: file });
      res.push(`${w}${lingua ? ' en' : ' it'} ${esito.variante} ${esito.largo}px, ${esito.visibili} pezzi, corpo min ${esito.corpoMin}px: ${esito.problemi.length ? esito.problemi.join(' | ') : 'ok'}`);
    }
  }
  await tab.close();
  return res.join('\n');
}
