// Генерирует SVG-баннеры README в стиле темы «Цветная» (мягкий тональный Material You)
// со встроенным урезанным шрифтом Nunito — на всех языках из strings.json.
// Запуск: cd tools/readme && npm install && node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(REPO, 'assets/readme');
const FONT = path.join(REPO, 'app/src/main/res/font/nunito.ttf');
// Версия для чипа в шапке — из app/build.gradle.kts, чтобы не устаревала
const VERSION = fs.readFileSync(path.join(REPO, 'app/build.gradle.kts'), 'utf8').match(/versionName = "([^"]+)"/)[1];
const STR = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/readme/strings.json'), 'utf8'));

// Палитра темы «Цветная» — те же значения, что ColorPalette в Theme.kt
const P = {
  bg: '#F7F2FA', ink: '#1D1B20', muted: '#49454F', surface: '#FFFFFF', surfaceHi: '#ECE6F0',
  primary: '#4A2FC0', onPrimary: '#FFFFFF', container: '#E8DEFF', onContainer: '#21005D',
  pink: '#FFD8E4', onPink: '#31111D', green: '#D7F5E1', onGreen: '#0B3B22',
  peach: '#FFE3CC', onPeach: '#4A2208', stroke: '#E4DAEE',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let allText = '';
const T = (s) => { allText += s; return esc(s); };

const style = (font) => `<style>
@font-face{font-family:"NUN";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 1000}
text{font-family:"NUN",ui-rounded,"Segoe UI",sans-serif}
.r{animation:in .7s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.r{animation:none}}
</style>`;

const frame = (w, h) => `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="32" fill="${P.bg}" stroke="${P.stroke}"/>`;

const svg = (w, h, label, body) => (font) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">\n${style(font)}\n${frame(w, h)}\n${body}\n</svg>\n`;

const spans = (parts) => parts.map(([s, c]) => `<tspan fill="${c}">${T(s)}</tspan>`).join('');
// «обычный *акцент* обычный» → части с цветом основного текста и акцента
const accent = (s, ink = P.ink, hi = P.primary) => s.split('*').map((p, i) => [p, i % 2 ? hi : ink]).filter(([p]) => p);
const delay = (i) => `style="animation-delay:${(i * 0.08).toFixed(2)}s"`;
const card = (x, y, w, h, fill, rx = 24) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

/** Пилюля-чип, как фильтры в приложении. Ширина — по тексту. */
function chip(x, y, text, { fill = P.container, color = P.onContainer, check = false } = {}) {
  const w = Math.round(text.length * 7.4 + (check ? 46 : 28));
  let s = `<rect x="${x}" y="${y}" width="${w}" height="30" rx="10" fill="${fill}"/>`;
  let tx = x + 14;
  if (check) {
    s += `<path d="M${x + 13} ${y + 15.5}l4 4 8-8.5" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    tx = x + 32;
  }
  s += `<text x="${tx}" y="${y + 20}" font-size="13" font-weight="800" fill="${color}">${T(text)}</text>`;
  return { s, w };
}

const sectionHead = (label, parts) => {
  const c = chip(40, 34, label, { check: true });
  return `<g class="r">${c.s}</g>
<g class="r" ${delay(1)}><text x="40" y="104" font-size="30" font-weight="900" letter-spacing="-.4">${spans(parts)}</text></g>`;
};

// ---------- телефон-калькулятор (как экран приложения) ----------
// Палитры — значения ColorPalette / OktoPalette / OktoLightPalette и «Своей» (янтарь) из Theme.kt.
const CALC = {
  tonal: { tonal: true, bg: P.bg, edge: P.stroke, well: P.container, wellEdge: null, wellInk: P.onContainer, dim: '#4F4566', ghost: '#D4C6F7',
    kinds: { d: ['#FFFFFF', P.ink], o: [P.container, P.onContainer], c: [P.pink, P.onPink], x: [P.surfaceHi, P.ink], e: [P.primary, '#FFFFFF'] } },
  okto: { bg: '#141414', edge: null, well: '#0A0A0A', wellEdge: '#1F1F1F', wellInk: '#F2F2F2', dim: '#8A8A8A', ghost: '#1C1C1C', keyEdge: '#070707',
    kinds: { d: ['#262626', '#EDEDED'], o: ['#262626', '#EDEDED'], c: ['#262626', '#EF5A5F'], x: ['#262626', '#EDEDED'], e: ['#EDEDED', '#141414'] } },
  light: { bg: '#F6F6F6', edge: '#DADADA', well: '#EAEAEA', wellEdge: '#D6D6D6', wellInk: '#141414', dim: '#7A7A7A', ghost: '#DADADA', keyEdge: '#C4C4C4',
    kinds: { d: ['#FFFFFF', '#141414'], o: ['#FFFFFF', '#141414'], c: ['#FFFFFF', '#D33A3F'], x: ['#FFFFFF', '#141414'], e: ['#141414', '#F6F6F6'] } },
  amber: { bg: '#120f0a', edge: null, well: '#050402', wellEdge: '#1d1809', wellInk: '#ffb000', dim: '#7a6a45', ghost: '#1a160e', keyEdge: '#000000',
    kinds: { d: ['#231d12', '#f3e7cf'], o: ['#231d12', '#ffb000'], c: ['#231d12', '#ef5a5f'], x: ['#231d12', '#f3e7cf'], e: ['#ffb000', '#120f0a'] } },
};
const KEYS = [
  [['AC', 'c'], ['()', 'o'], ['%', 'o'], ['÷', 'o']],
  [['7', 'd'], ['8', 'd'], ['9', 'd'], ['×', 'o']],
  [['4', 'd'], ['5', 'd'], ['6', 'd'], ['−', 'o']],
  [['1', 'd'], ['2', 'd'], ['3', 'd'], ['+', 'o']],
  [['0', 'd'], ['.', 'd'], ['⌫', 'x'], ['=', 'e']],
];
function phoneCalc(x, y, p, k = 1) {
  let s = `<rect width="150" height="228" rx="20" fill="${p.bg}"${p.edge ? ` stroke="${p.edge}"` : ''}/>`;
  s += `<rect x="10" y="12" width="130" height="64" rx="${p.tonal ? 16 : 10}" fill="${p.well}"${p.wellEdge ? ` stroke="${p.wellEdge}"` : ''}/>`;
  s += `<rect x="17" y="19" width="20" height="9" rx="${p.tonal ? 4.5 : 3}" fill="${p.ghost}"/><rect x="40" y="19" width="20" height="9" rx="${p.tonal ? 4.5 : 3}" fill="${p.ghost}"/>`;
  s += `<rect x="92" y="19" width="19" height="9" rx="${p.tonal ? 4.5 : 3}" fill="${p.ghost}"/><rect x="114" y="19" width="19" height="9" rx="${p.tonal ? 4.5 : 3}" fill="${p.ghost}"/>`;
  s += `<text x="132" y="54" text-anchor="end" font-size="17" font-weight="800" fill="${p.wellInk}">${T('128 × 6')}</text>`;
  s += `<text x="132" y="69" text-anchor="end" font-size="10" font-weight="700" fill="${p.dim}">${T('768')}</text>`;
  const w = 29.5, h = 22, gap = 4;
  KEYS.forEach((row, r) => row.forEach(([label, kind], c) => {
    const kx = 10 + c * (w + gap), ky = 86 + r * (h + gap);
    const [fill, ink] = p.kinds[kind];
    const rx = p.tonal ? h / 2 : 6;
    if (p.tonal) s += `<rect x="${kx}" y="${ky}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
    else s += `<rect x="${kx}" y="${ky}" width="${w}" height="${h}" rx="${rx}" fill="${p.keyEdge}"/><rect x="${kx}" y="${ky}" width="${w}" height="${h - 2}" rx="${rx}" fill="${fill}"/>`;
    const cx = kx + w / 2, cy = ky + (p.tonal ? h / 2 : (h - 2) / 2);
    if (label === '⌫') s += `<path d="M${cx + 4} ${cy - 4}h-6.5l-3.5 4 3.5 4h6.5z M${cx - 1} ${cy - 2}l3 4m0 -4l-3 4" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
    else s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="${ink}">${T(label)}</text>`;
  }));
  return `<g transform="translate(${x} ${y}) scale(${k})">${s}</g>`;
}

// ---------- HERO ----------
function hero(t) {
  const W = 880, H = 480;
  let b = '';
  b += `<g class="r"><circle cx="54" cy="56" r="14" fill="${P.primary}"/><circle cx="54" cy="56" r="5" fill="#fff"/>
<text x="78" y="64" font-size="24" font-weight="900" letter-spacing="-.4" fill="${P.ink}">${T('Okto Calc')}</text></g>`;
  const v = chip(220, 41, 'v' + VERSION, { fill: P.surfaceHi, color: P.muted });
  b += `<g class="r" ${delay(1)}>${v.s}</g>`;
  b += `<g class="r" ${delay(2)}><text x="40" y="146" font-size="40" font-weight="900" letter-spacing="-1">${spans(accent(t.hero.title[0]))}</text>
<text x="40" y="194" font-size="40" font-weight="900" letter-spacing="-1">${spans(accent(t.hero.title[1]))}</text></g>`;
  b += `<g class="r" ${delay(3)}><text x="40" y="234" font-size="17" font-weight="600" fill="${P.muted}">${T(t.hero.sub[0])}</text>
<text x="40" y="258" font-size="17" font-weight="600" fill="${P.muted}">${T(t.hero.sub[1])}</text></g>`;

  const colors = [['#fff', P.ink, P.muted], [P.green, P.onGreen, '#24533A'], [P.pink, P.onPink, '#633B48'], [P.container, P.onContainer, '#4F4566']];
  const feats = t.hero.cards.map(([a, b], i) => [a, b, ...colors[i]]);
  feats.forEach(([t, d, fill, c1, c2], i) => {
    const x = 40 + (i % 2) * 262, y = 290 + Math.floor(i / 2) * 86;
    b += `<g class="r" ${delay(4 + i)}>${card(x, y, 250, 74, fill)}
<text x="${x + 20}" y="${y + 32}" font-size="17" font-weight="900" fill="${c1}">${T(t)}</text>
<text x="${x + 20}" y="${y + 54}" font-size="14" font-weight="700" fill="${c2}">${T(d)}</text></g>`;
  });

  b += `<g class="r" ${delay(3)}>${phoneCalc(588, 44, CALC.tonal, 1.7)}</g>`;
  return svg(W, H, t.hero.alt, b);
}

// ---------- КНОПКИ ----------
const androidIcon = (c) => `<g transform="translate(18 14)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10.5a5 5 0 0 1 10 0v.5H7z"/><path d="M8.6 6.6 7.4 4.8M15.4 6.6l1.2-1.8"/><rect x="7" y="12.5" width="10" height="7" rx="1.6"/></g>`;
const sparkIcon = (c) => `<g transform="translate(18 14)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l1.8 4.6L18.5 10l-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4z"/></g>`;

function button(label, icon, fill, color) {
  return (font) => {
    const w = Math.round(52 + label.length * 9.4 + 22);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="52" viewBox="0 0 ${w} 52" role="img" aria-label="${esc(label)}">
<style>@font-face{font-family:"NUN";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 1000}text{font-family:"NUN",ui-rounded,"Segoe UI",sans-serif}</style>
<rect width="${w}" height="52" rx="18" fill="${fill}"/>
${icon(color)}
<text x="50" y="32" font-size="16" font-weight="800" fill="${color}">${T(label)}</text>
</svg>
`;
  };
}

// ---------- ВОЗМОЖНОСТИ ----------
function features(t) {
  const W = 880, H = 470;
  let b = sectionHead(t.features.chip, accent(t.features.title));
  const colors = [['#fff', P.ink, P.muted], [P.container, P.onContainer, '#4F4566'], [P.green, P.onGreen, '#24533A'], [P.pink, P.onPink, '#633B48']];
  const items = t.features.items.map(([title, lines], i) => [String(i + 1), title, lines, ...colors[i]]);
  items.forEach(([n, t, lines, fill, c1, c2], i) => {
    const x = 40 + (i % 2) * 408, y = 132 + Math.floor(i / 2) * 156;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, 392, 140, fill, 28)}
<circle cx="${x + 40}" cy="${y + 42}" r="18" fill="${P.primary}"/><text x="${x + 40}" y="${y + 48}" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">${T(n)}</text>
<text x="${x + 70}" y="${y + 49}" font-size="21" font-weight="900" fill="${c1}">${T(t)}</text>
${lines.map((l, k) => `<text x="${x + 24}" y="${y + 92 + k * 22}" font-size="15" font-weight="600" fill="${c2}">${T(l)}</text>`).join('\n')}</g>`;
  });
  return svg(W, H, t.features.alt, b);
}

// ---------- ТЕМЫ ----------
function themes(t) {
  const W = 880, H = 520;
  let b = sectionHead(t.themes.chip, accent(t.themes.title));
  const cols = [
    [...t.themes.cols[0], (x, y) => phoneCalc(x, y, CALC.tonal)],
    [...t.themes.cols[1], (x, y) => phoneCalc(x, y, CALC.okto)],
    [...t.themes.cols[2], (x, y) => phoneCalc(x, y, CALC.light)],
    [...t.themes.cols[3], (x, y) => phoneCalc(x, y, CALC.amber)],
  ];
  cols.forEach(([t, d, phone], i) => {
    const x = 40 + i * 204, y = 132;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, 188, 320, '#fff', 28)}${phone(x + 19, y + 20)}
<text x="${x + 20}" y="${y + 274}" font-size="20" font-weight="900" fill="${P.ink}">${T(t)}</text>
<text x="${x + 20}" y="${y + 298}" font-size="14" font-weight="700" fill="${P.muted}">${T(d)}</text></g>`;
  });
  const sw = ['#8a8a8a', '#7c5cff', '#3d7bff', '#2ec4d6', '#2fbf8a', '#5cc85a', '#a6d93a', '#ffb000', '#ff7a2e', '#ef5a5f', '#ff5c9a', '#b05cff'];
  sw.forEach((c, i) => { b += `<circle class="r" ${delay(6 + i * 0.3)} cx="${52 + i * 26}" cy="${H - 34}" r="9" fill="${c}"/>`; });
  b += `<text x="${52 + 12 * 26 + 2}" y="${H - 29}" font-size="14" font-weight="700" fill="${P.muted}">${T(t.themes.accents)}</text>`;
  return svg(W, H, t.themes.alt, b);
}

// ---------- В ЦИФРАХ ----------
function numbers(t) {
  const W = 880, H = 290;
  let b = sectionHead(t.numbers.chip, accent(t.numbers.title));
  const colors = [[P.primary, '#fff', '#E1D9FF'], ['#fff', P.ink, P.muted], [P.green, P.onGreen, '#24533A'], [P.pink, P.onPink, '#633B48'], [P.container, P.onContainer, '#4F4566']];
  const items = t.numbers.items.map(([n, unit, lines], i) => [n, unit, lines, ...colors[i]]);
  const w = (800 - 4 * 12) / 5;
  items.forEach(([n, unit, lines, fill, c1, c2], i) => {
    const x = 40 + i * (w + 12), y = 132;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, w, 124, fill, 24)}
<text x="${x + 20}" y="${y + 56}" font-size="40" font-weight="900" letter-spacing="-1" fill="${c1}">${T(n)}<tspan font-size="18">${T(unit)}</tspan></text>
${lines.map((l, k) => `<text x="${x + 20}" y="${y + 86 + k * 18}" font-size="14" font-weight="700" fill="${c2}">${T(l)}</text>`).join('\n')}</g>`;
  });
  return svg(W, H, t.numbers.alt, b);
}

// ---------- сборка ----------
// Шрифт урезается отдельно под каждый язык — только нужные буквы.
fs.mkdirSync(OUT, { recursive: true });
const fontSrc = fs.readFileSync(FONT);
for (const [lang, t] of Object.entries(STR)) {
  allText = '';
  const files = {
    [`hero-${lang}.svg`]: hero(t),
    [`btn-android-${lang}.svg`]: button(t.buttons.android, androidIcon, P.primary, '#fff'),
    [`btn-new-${lang}.svg`]: button(t.buttons.whatsNew, sparkIcon, P.container, P.onContainer),
    [`features-${lang}.svg`]: features(t),
    [`themes-${lang}.svg`]: themes(t),
    [`numbers-${lang}.svg`]: numbers(t),
  };
  for (const f of Object.values(files)) f(''); // собрать весь текст для урезания шрифта
  const chars = [...new Set(allText + '0123456789')].join('');
  const font = (await subsetFont(fontSrc, chars, { targetFormat: 'woff2' })).toString('base64');
  let size = 0;
  for (const [name, render] of Object.entries(files)) {
    const out = render(font);
    fs.writeFileSync(path.join(OUT, name), out);
    size += out.length;
  }
  console.log(lang, (size / 1024).toFixed(1) + ' KB,', 'glyphs:', chars.length);
}
