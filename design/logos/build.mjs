// Варианты логотипа Okto Calculator: node build.mjs → *.svg и index.html (картинки встроены, страница открывается одна)
import { writeFileSync } from 'node:fs';

const OR = '#FF7A1A';
const T = {
  dark:  { bg: '#0E0E0E', ink: '#F2F2F2', key: '#2A2A2A', key2: '#3A3A3A', onOr: '#140A00' },
  light: { bg: '#F6F6F6', ink: '#141414', key: '#E4E4E4', key2: '#D2D2D2', onOr: '#140A00' },
};
const c = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const rr = (x, y, w, h, r, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"/>`;
const ln = (x1, y1, x2, y2, s, w = 2.6) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" stroke-linecap="round"/>`;
const eq = (cx, cy, w, gap, th, f) => rr(cx - w / 2, cy - gap / 2 - th, w, th, th / 2, f) + rr(cx - w / 2, cy + gap / 2, w, th, th / 2, f);

// Всё рисуется в круге радиусом 30 от центра 54,54 — безопасная зона адаптивной иконки
const V = [
  { id: 'ring', name: 'Окто-кольцо', note: 'Восемь клавиш по кругу — «окто», в центре оранжевое «равно».',
    draw: t => Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      return c((54 + 21 * Math.cos(a)).toFixed(2), (54 + 21 * Math.sin(a)).toFixed(2), 5, t.key2);
    }).join('') + c(54, 54, 11, OR) + eq(54, 54, 10, 3, 2.4, t.onOr) },
  { id: 'segment', name: 'Сегментная 8', note: 'Цифра 8 как на табло калькулятора, средний сегмент оранжевый.',
    draw: t => rr(46, 32, 16, 6, 3, t.ink) + rr(46, 51, 16, 6, 3, OR) + rr(46, 70, 16, 6, 3, t.ink)
      + rr(39, 38.5, 6, 12, 3, t.ink) + rr(63, 38.5, 6, 12, 3, t.ink)
      + rr(39, 57.5, 6, 12, 3, t.ink) + rr(63, 57.5, 6, 12, 3, t.ink) },
  { id: 'equals', name: 'Равно', note: 'Самый простой знак: оранжевая круглая клавиша «=».',
    draw: t => c(54, 54, 27, OR) + eq(54, 54, 24, 7, 5.5, t.onOr) },
  { id: 'keys', name: 'Четыре действия', note: 'Клавиши 2×2: плюс, минус, умножить и оранжевое «равно».',
    draw: t => c(43, 43, 10, t.key) + c(65, 43, 10, t.key) + c(43, 65, 10, t.key) + c(65, 65, 10, OR)
      + ln(38.5, 43, 47.5, 43, t.ink) + ln(43, 38.5, 43, 47.5, t.ink)
      + ln(60.5, 43, 69.5, 43, t.ink)
      + ln(39.8, 61.8, 46.2, 68.2, t.ink) + ln(46.2, 61.8, 39.8, 68.2, t.ink)
      + eq(65, 65, 9, 3, 2.4, t.onOr) },
  { id: 'octo', name: 'Осьминог', note: 'Голова — оранжевая клавиша, щупальца — ряд кнопок.',
    draw: t => c(54, 47, 16, OR) + c(48.5, 48, 2.4, t.onOr) + c(59.5, 48, 2.4, t.onOr)
      + [39, 49, 59, 69].map((x, i) => c(x, i % 3 ? 73 : 70, 4.2, t.key2)).join('') },
];

const svg = (v, mode) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" fill="${T[mode].bg}"/>${v.draw(T[mode])}</svg>`;

let cards = '';
V.forEach((v, i) => {
  for (const m of ['dark', 'light']) writeFileSync(`${i + 1}-${v.id}-${m}.svg`, svg(v, m) + '\n');
  const icon = (m, cls) => `<img class="${cls}" src="data:image/svg+xml,${encodeURIComponent(svg(v, m))}" alt="${v.name}, ${m === 'dark' ? 'тёмный' : 'светлый'}">`;
  cards += `<article><div class="pair">${icon('dark', 'big sq')}${icon('light', 'big sq')}</div>
<div class="small">${icon('dark', 'ci')}${icon('light', 'ci')}${icon('dark', 'tiny sq')}${icon('light', 'tiny sq')}</div>
<h2><span>${i + 1}</span>${v.name}</h2><p>${v.note}</p></article>\n`;
});

writeFileSync('index.html', `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Логотипы Okto Calc</title>
<link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--bg:#000;--card:#0d0d0d;--line:#1f1f1f;--ink:#ededed;--mut:#8e8e8e;--or:${OR}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Golos Text',sans-serif;padding:40px 16px;
background-image:radial-gradient(600px 300px at 50% -80px,#ff7a1a33,transparent)}
header{max-width:1100px;margin:0 auto 32px}h1{font-size:34px;margin:0 0 6px;font-weight:700}h1 b{color:var(--or)}
header p{color:var(--mut);margin:0}
main{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
article{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px}
.pair{display:flex;gap:12px}.big{width:calc(50% - 6px);aspect-ratio:1}
.sq{border-radius:23%}.ci{border-radius:50%;width:44px;height:44px}.tiny{width:24px;height:24px}
.small{display:flex;gap:12px;align-items:center;margin:14px 0 4px}
img{outline:1px solid #262626}
h2{font-size:18px;margin:10px 0 4px;display:flex;gap:10px;align-items:center}
h2 span{font:500 12px 'JetBrains Mono',monospace;color:var(--or);border:1px solid #ff7a1a55;border-radius:6px;padding:2px 6px}
article p{color:var(--mut);margin:0;font-size:14px;line-height:1.45}
</style></head><body>
<header><h1>Okto Calc — <b>5 логотипов</b></h1><p>Каждый в тёмном и светлом варианте; маски — квадрат со скруглением, круг и 24 px.</p></header>
<main>
${cards}</main></body></html>
`);
