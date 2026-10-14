// Генерирует SVG-баннеры README: чёрный фон, градиенты, белый текст и лёгкие анимации.
// Шрифты Golos Text (текст) и JetBrains Mono (цифры, подписи) встраиваются урезанными под каждый язык.
// Запуск: cd tools/readme && npm install && node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(REPO, 'assets/readme');
const FONT_G = path.join(REPO, 'app/src/main/res/font/golos.ttf');
const FONT_M = path.join(REPO, 'app/src/main/res/font/jbmono.ttf');
const VERSION = fs.readFileSync(path.join(REPO, 'app/build.gradle.kts'), 'utf8').match(/versionName = "([^"]+)"/)[1];
const STR = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/readme/strings.json'), 'utf8'));

const P = { ink: '#FFFFFF', muted: '#A3A3A3', dim: '#6E6E6E', stroke: '#2A2A2A' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let allText = '';
const T = (s) => { allText += s; return esc(s); };

const style = (fg, fm) => `<style>
@font-face{font-family:"G";src:url(data:font/woff2;base64,${fg}) format("woff2");font-weight:100 900}
@font-face{font-family:"M";src:url(data:font/woff2;base64,${fm}) format("woff2");font-weight:100 900}
text{font-family:"G","Segoe UI",system-ui,sans-serif}
.m{font-family:"M",ui-monospace,Consolas,monospace}
.r{animation:rise .8s cubic-bezier(.2,.8,.2,1) backwards}
.glow{animation:drift 14s ease-in-out infinite}
.glow2{animation:drift 18s ease-in-out -6s infinite reverse}
.blink{animation:blink 1.1s steps(1) infinite}
.pulse{animation:pulse 2.6s ease-in-out infinite}
.sweep{animation:sweep 6s ease-in-out infinite}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(36px,22px)}}
@keyframes blink{50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:0}50%{opacity:.22}}
@keyframes sweep{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
@media (prefers-reduced-motion:reduce){.r,.glow,.glow2,.blink,.pulse,.sweep{animation:none}}
</style>`;

const defs = (w, h) => `<defs>
<radialGradient id="g1" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9aa4b8" stop-opacity=".14"/><stop offset="1" stop-color="#9aa4b8" stop-opacity="0"/></radialGradient>
<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient>
<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#8d8d8d"/></linearGradient>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0d0d"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="clip"><rect width="${w}" height="${h}" rx="24"/></clipPath>
</defs>`;

const frame = (w, h) => `<g clip-path="url(#clip)"><rect width="${w}" height="${h}" fill="url(#bg)"/>
<circle class="glow" cx="${w * 0.82}" cy="${h * 0.2}" r="${h * 0.7}" fill="url(#g1)"/>
<circle class="glow2" cx="${w * 0.1}" cy="${h * 0.95}" r="${h * 0.6}" fill="url(#g2)"/>
<rect class="sweep" x="0" y="0" width="${w * 0.35}" height="${h}" fill="url(#sw)"/></g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="24" fill="none" stroke="#242424"/>`;

const svg = (w, h, label, body) => (fg, fm) =>
  `<svg xmlns="http://www.w3.org/2000/svg" fill="#fff" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">\n${style(fg, fm)}\n${defs(w, h)}\n${frame(w, h)}\n${body}\n</svg>\n`;

const spans = (parts) => parts.map(([s, hi]) => `<tspan${hi ? ' fill="url(#tg)"' : ''}>${T(s)}</tspan>`).join('');
// «обычный *акцент* обычный» → акцент заливается градиентом
const accent = (s) => s.split('*').map((p, i) => [p, i % 2 === 1]).filter(([p]) => p);
const delay = (i) => `style="animation-delay:${(i * 0.09).toFixed(2)}s"`;

const card = (x, y, w, h, rx = 18) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#cg)" stroke="${P.stroke}"/><rect x="${x + rx}" y="${y + .5}" width="${w - rx * 2}" height="1" fill="url(#hl)"/>`;

/** Метка-чип в стиле подписей Okto: моно, заглавные. */
function chip(x, y, text, { check = false } = {}) {
  const label = text.toUpperCase();
  const w = Math.round(label.length * 8.4 + (check ? 46 : 28));
  let s = `<rect x="${x}" y="${y}" width="${w}" height="30" rx="8" fill="#141414" stroke="#333"/>`;
  let tx = x + 14;
  if (check) {
    s += `<path d="M${x + 13} ${y + 15.5}l4 4 8-8.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    tx = x + 32;
  }
  s += `<text class="m" x="${tx}" y="${y + 20}" font-size="12" font-weight="600" letter-spacing="1" fill="#fff">${T(label)}</text>`;
  return { s, w };
}

const sectionHead = (label, parts) => {
  const c = chip(40, 34, label, { check: true });
  return `<g class="r">${c.s}</g>
<g class="r" ${delay(1)}><text x="40" y="104" font-size="32" font-weight="800" letter-spacing="-.6">${spans(parts)}</text></g>`;
};

// ---------- телефон-калькулятор (как экран приложения) ----------
// Палитры — значения OktoPalette / OktoLightPalette из Theme.kt.
const CALC = {
  dark: { bg: '#0B0B0B', edge: '#2e2e2e', ink: '#F2F2F2', dim: '#8A8A8A', ghost: '#1C1C1C', accent: '#FF7A1A', eqInk: '#140A00', pulse: '#fff',
    kinds: { d: ['#1C1C1C', '#EDEDED'], o: ['#2A1A0D', '#FF7A1A'], c: ['#1C1C1C', '#EF5A5F'], x: ['#1C1C1C', '#EDEDED'], e: ['#FF7A1A', '#140A00'] } },
  light: { bg: '#F6F6F6', edge: '#DADADA', keyStroke: '#E0E0E0', ink: '#141414', dim: '#7A7A7A', ghost: '#E4E4E4', accent: '#FF7A1A', eqInk: '#140A00', pulse: '#000',
    kinds: { d: ['#FFFFFF', '#141414'], o: ['#FFE8D5', '#C85400'], c: ['#FFFFFF', '#D33A3F'], x: ['#FFFFFF', '#141414'], e: ['#FF7A1A', '#140A00'] } },
};
const KEYS = [
  [['AC', 'c'], ['()', 'o'], ['%', 'o'], ['÷', 'o']],
  [['7', 'd'], ['8', 'd'], ['9', 'd'], ['×', 'o']],
  [['4', 'd'], ['5', 'd'], ['6', 'd'], ['−', 'o']],
  [['1', 'd'], ['2', 'd'], ['3', 'd'], ['+', 'o']],
  [['0', 'd'], ['.', 'd'], ['⌫', 'x'], ['=', 'e']],
];
function phoneCalc(x, y, p, k = 1) {
  let s = `<rect width="150" height="228" rx="20" fill="${p.bg}" stroke="${p.edge}"/>`;
  for (const cx of [14, 38, 100, 122]) s += `<rect x="${cx}" y="13" width="${cx < 60 ? 20 : 19}" height="8" rx="3" fill="${p.ghost}"/>`;
  s += `<text class="m" x="132" y="50" text-anchor="end" font-size="26" font-weight="400" letter-spacing="-1" fill="${p.ink}">${T('128 × 6')}</text>`;
  s += `<rect class="blink" x="135" y="30" width="1.6" height="22" fill="${p.accent}"/>`;
  s += `<text class="m" x="134" y="64" text-anchor="end" font-size="10" fill="${p.dim}">${T('768')}</text>`;
  const d = 26, gap = 4.7, x0 = (150 - (4 * d + 3 * gap)) / 2, y0 = 72;
  KEYS.forEach((row, r) => row.forEach(([label, kind], c) => {
    const cx = x0 + c * (d + gap) + d / 2, cy = y0 + r * (d + gap) + d / 2;
    const [fill, ink] = p.kinds[kind];
    s += `<circle cx="${cx}" cy="${cy}" r="${d / 2}" fill="${fill}"${p.keyStroke ? ` stroke="${p.keyStroke}"` : ''}/>`;
    if (kind === 'e') s += `<circle class="pulse" cx="${cx}" cy="${cy}" r="${d / 2}" fill="${p.pulse}"/>`;
    if (label === '⌫') s += `<path d="M${cx + 5} ${cy - 4.5}h-7.5l-4 4.5 4 4.5h7.5z M${cx - 1} ${cy - 2.2}l3.4 4.4m0 -4.4l-3.4 4.4" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
    else s += `<text class="m" x="${cx}" y="${cy + 4.3}" text-anchor="middle" font-size="12.5" font-weight="500" fill="${ink}">${T(label)}</text>`;
  }));
  return `<g transform="translate(${x} ${y}) scale(${k})">${s}</g>`;
}

// ---------- HERO ----------
function hero(t) {
  const W = 880, H = 480;
  let b = '';
  b += `<g class="r"><rect x="40" y="38" width="32" height="32" rx="9" fill="#0E0E0E" stroke="#3a3a3a"/>
<rect x="46" y="44" width="20" height="8" rx="2.5" fill="#262626"/><rect x="58" y="46" width="6" height="4" rx="1" fill="#fff"/>
<circle cx="49" cy="60" r="2.8" fill="#444"/><circle cx="56" cy="60" r="2.8" fill="#444"/><circle cx="63" cy="60" r="2.8" fill="#FF7A1A"/>
<text x="84" y="61" font-size="22" font-weight="800" letter-spacing="-.3">${T('Okto Calc')}</text></g>`;
  const v = chip(222, 39, 'v' + VERSION);
  b += `<g class="r" ${delay(1)}>${v.s}</g>`;
  b += `<g class="r" ${delay(2)}><text x="40" y="146" font-size="38" font-weight="800" letter-spacing="-1">${spans(accent(t.hero.title[0]))}</text>
<text x="40" y="192" font-size="38" font-weight="800" letter-spacing="-1">${spans(accent(t.hero.title[1]))}</text></g>`;
  b += `<g class="r" ${delay(3)}><text x="40" y="232" font-size="16" font-weight="500" fill="${P.muted}">${T(t.hero.sub[0])}</text>
<text x="40" y="256" font-size="16" font-weight="500" fill="${P.muted}">${T(t.hero.sub[1])}</text></g>`;
  t.hero.cards.forEach(([a, d], i) => {
    const x = 40 + (i % 2) * 262, y = 290 + Math.floor(i / 2) * 86;
    b += `<g class="r" ${delay(4 + i)}>${card(x, y, 250, 74)}
<text x="${x + 20}" y="${y + 32}" font-size="16" font-weight="700">${T(a)}</text>
<text x="${x + 20}" y="${y + 54}" font-size="13" font-weight="500" fill="${P.muted}">${T(d)}</text></g>`;
  });
  b += `<g class="r" ${delay(3)}><ellipse cx="722" cy="244" rx="150" ry="190" fill="url(#g1)"/>${phoneCalc(594, 46, CALC.dark, 1.7)}</g>`;
  return svg(W, H, t.hero.alt, b);
}

// ---------- КНОПКИ ----------
const androidIcon = (c) => `<g transform="translate(18 14)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10.5a5 5 0 0 1 10 0v.5H7z"/><path d="M8.6 6.6 7.4 4.8M15.4 6.6l1.2-1.8"/><rect x="7" y="12.5" width="10" height="7" rx="1.6"/></g>`;
const sparkIcon = (c) => `<g transform="translate(18 14)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l1.8 4.6L18.5 10l-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4z"/></g>`;

function button(label, icon, primary) {
  return (fg) => {
    const w = Math.round(52 + label.length * 9 + 22);
    const fill = primary ? '#FFFFFF' : '#161616';
    const ink = primary ? '#0A0A0A' : '#FFFFFF';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="52" viewBox="0 0 ${w} 52" role="img" aria-label="${esc(label)}">
<style>@font-face{font-family:"G";src:url(data:font/woff2;base64,${fg}) format("woff2");font-weight:100 900}text{font-family:"G","Segoe UI",system-ui,sans-serif}</style>
<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${primary ? '#FFFFFF' : '#202020'}"/><stop offset="1" stop-color="${primary ? '#D9D9D9' : '#101010'}"/></linearGradient></defs>
<rect x=".5" y=".5" width="${w - 1}" height="51" rx="14" fill="url(#b)" stroke="${primary ? '#fff' : '#333'}"/>
${icon(ink)}
<text x="50" y="32" font-size="15" font-weight="700" fill="${ink}">${T(label)}</text>
</svg>
`;
  };
}

// ---------- ВОЗМОЖНОСТИ ----------
function features(t) {
  const W = 880, H = 470;
  let b = sectionHead(t.features.chip, accent(t.features.title));
  t.features.items.forEach(([title, lines], i) => {
    const x = 40 + (i % 2) * 408, y = 132 + Math.floor(i / 2) * 156;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, 392, 140, 20)}
<circle cx="${x + 40}" cy="${y + 42}" r="16" fill="#fff"/><text class="m" x="${x + 40}" y="${y + 47}" text-anchor="middle" font-size="15" font-weight="700" fill="#000">${T(String(i + 1))}</text>
<text x="${x + 68}" y="${y + 48}" font-size="20" font-weight="700">${T(title)}</text>
${lines.map((l, k) => `<text x="${x + 24}" y="${y + 92 + k * 22}" font-size="15" font-weight="500" fill="${P.muted}">${T(l)}</text>`).join('\n')}</g>`;
  });
  return svg(W, H, t.features.alt, b);
}

// ---------- ТЕМЫ ----------
function themes(t) {
  const W = 880, H = 420;
  let b = sectionHead(t.themes.chip, accent(t.themes.title));
  const phones = [CALC.dark, CALC.light];
  t.themes.cols.forEach(([name, lines], i) => {
    const x = 40 + i * 408, y = 132;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, 392, 252, 20)}${phoneCalc(x + 24, y + 12, phones[i], 1.0)}
<text class="m" x="${x + 196}" y="${y + 70}" font-size="12" font-weight="600" letter-spacing="1" fill="${P.dim}">${T(String(i + 1).padStart(2, '0'))}</text>
<text x="${x + 196}" y="${y + 104}" font-size="26" font-weight="800" letter-spacing="-.4">${T(name)}</text>
${lines.map((l, k) => `<text x="${x + 196}" y="${y + 138 + k * 22}" font-size="15" font-weight="500" fill="${P.muted}">${T(l)}</text>`).join('\n')}</g>`;
  });
  return svg(W, H, t.themes.alt, b);
}

// ---------- В ЦИФРАХ ----------
function numbers(t) {
  const W = 880, H = 290;
  let b = sectionHead(t.numbers.chip, accent(t.numbers.title));
  const w = (800 - 4 * 12) / 5;
  t.numbers.items.forEach(([n, unit, lines], i) => {
    const x = 40 + i * (w + 12), y = 132;
    b += `<g class="r" ${delay(2 + i)}>${card(x, y, w, 124, 18)}
<text class="m" x="${x + 20}" y="${y + 56}" font-size="38" font-weight="700" letter-spacing="-1" fill="url(#tg)">${T(n)}<tspan font-size="16" fill="${P.muted}">${T(unit)}</tspan></text>
${lines.map((l, k) => `<text x="${x + 20}" y="${y + 86 + k * 18}" font-size="13" font-weight="500" fill="${P.muted}">${T(l)}</text>`).join('\n')}</g>`;
  });
  return svg(W, H, t.numbers.alt, b);
}

// ---------- сборка ----------
// Шрифты урезаются отдельно под каждый язык — только нужные буквы.
fs.mkdirSync(OUT, { recursive: true });
const srcG = fs.readFileSync(FONT_G);
const srcM = fs.readFileSync(FONT_M);
for (const [lang, t] of Object.entries(STR)) {
  allText = '';
  const files = {
    [`hero-${lang}.svg`]: hero(t),
    [`btn-android-${lang}.svg`]: button(t.buttons.android, androidIcon, true),
    [`btn-new-${lang}.svg`]: button(t.buttons.whatsNew, sparkIcon, false),
    [`features-${lang}.svg`]: features(t),
    [`themes-${lang}.svg`]: themes(t),
    [`numbers-${lang}.svg`]: numbers(t),
  };
  for (const f of Object.values(files)) f('', ''); // собрать весь текст для урезания шрифтов
  const chars = [...new Set(allText + '0123456789vOktoCalc.')].join('');
  const sub = async (src) => (await subsetFont(src, chars, { targetFormat: 'woff2' })).toString('base64');
  const [fg, fm] = [await sub(srcG), await sub(srcM)];
  let size = 0;
  for (const [name, render] of Object.entries(files)) {
    const out = render(fg, fm);
    fs.writeFileSync(path.join(OUT, name), out);
    size += out.length;
  }
  console.log(lang, (size / 1024).toFixed(1) + ' KB,', 'glyphs:', chars.length);
}
