const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const body = document.body, pin = $('#pin'), rig = $('#rig'), glow = $('#glow'), sheet = $('#sheet'), root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;

// --- Язык: русский текст в разметке, английский в data-en ------------------------------------
const TEXT = {
  ru: { position: (n, total) => `Комната ${n} из ${total}`,
    office: { caption: 'Один из офисов в этом здании. Снимка именно этой комнаты пока нет.', title: 'Цену, размер и что свободно, можно узнать по телефону.' },
    meeting: { caption: 'Переговорная в этом здании.', title: 'Ею могут пользоваться все арендаторы', note: 'Цену офиса, размер и что свободно, можно узнать по телефону.' },
    alt: { 'office-window': 'Пустой офис с большим окном', 'office-corner': 'Пустой угловой офис с матовыми окнами и тёмным ковром', 'office-blinds': 'Пустой угловой офис с жалюзи на окнах', 'office-narrow': 'Пустой офис с жёлтой и коричневой стенами и жалюзи', 'office-glass': 'Пустой офис за стеклянной стеной, за окном деревья', 'meeting-room': 'Переговорная с длинным столом и креслами' },
    message: 'Здравствуйте! Интересует офис на 5345 Madison Ave. Подскажите цену, размер и что сейчас свободно?',
    title: 'Офисы в аренду в Сакраменто от $500 в месяц | Madison Business Center', other: 'English', sw: 'EN' },
  en: { position: (n, total) => `Room ${n} of ${total}`,
    office: { caption: "One of the offices in this building. We don't have a photo of this exact room yet.", title: "You can get the price, the size and what's available by phone." },
    meeting: { caption: 'The conference room in this building.', title: 'Any tenant can use it', note: "You can get the price of an office, the size and what's available by phone." },
    alt: { 'office-window': 'Empty office with a large window', 'office-corner': 'Empty corner office with frosted windows and a dark carpet', 'office-blinds': 'Empty corner office with blinds on the windows', 'office-narrow': 'Empty office with yellow and brown walls and blinds', 'office-glass': 'Empty office behind a glass wall, with trees outside', 'meeting-room': 'Conference room with a long table and chairs' },
    message: "Hi! I'm interested in an office at 5345 Madison Ave. Can you tell me the price, the size and what's available now?",
    title: 'Offices for rent in Sacramento from $500 a month | Madison Business Center', other: 'Русский', sw: 'RU' },
};
const waLink = (text) => `https://wa.me/19169144407?text=${encodeURIComponent(text)}`;
const t = () => TEXT[root.lang];
$$('[data-en]').forEach((e) => { e.dataset.ru = e.innerHTML; });
$$('[data-en-label]').forEach((e) => { e.dataset.ruLabel = e.getAttribute('aria-label'); });
$$('[data-en-alt]').forEach((e) => { e.dataset.ruAlt = e.alt; });
const h1 = $('#h1');

function setLang(l) {
  root.lang = l;
  $$('[data-en]').forEach((e) => { e.innerHTML = l === 'en' ? e.dataset.en : e.dataset.ru; });
  $$('[data-en-label]').forEach((e) => e.setAttribute('aria-label', l === 'en' ? e.dataset.enLabel : e.dataset.ruLabel));
  $$('[data-en-alt]').forEach((e) => { e.alt = l === 'en' ? e.dataset.enAlt : e.dataset.ruAlt; });
  $('#lang').textContent = t().sw;
  $('#lang').setAttribute('aria-label', t().other);
  document.title = t().title;
  $$('.wa').forEach((a) => { a.href = waLink(a.getAttribute(`data-wa-${l}`) || t().message); });
  try { localStorage.setItem('lang', l); } catch (e) {}
  if (shown) fillSheet(shown);
  fit();
  place();
}
$('#lang').addEventListener('click', () => setLang(root.lang === 'en' ? 'ru' : 'en'));

// --- Огромные надписи подбираются под ширину экрана, чтобы читались целиком ---------------------
function fitLine(el, maxH) {
  el.style.fontSize = '100px';
  const size = Math.min((root.clientWidth - 2 * parseFloat(getComputedStyle(el).left)) / el.scrollWidth * 100, maxH);
  el.style.fontSize = size + 'px';
  return size;
}
function fit() {
  const phone = root.clientWidth < 900, h = pin.clientHeight;
  const bar = phone ? 56 : 64;
  const lines = root.lang === 'en' ? (phone ? h1.dataset.en : h1.dataset.wideEn) : (phone ? h1.dataset.ru : h1.dataset.wide);
  h1.innerHTML = lines;
  // Заголовок кончается выше кружка с ценой, кружок на него не наезжает
  const card = $('.card-hero').offsetHeight;
  const free = (h - card + parseFloat(getComputedStyle($('.badge')).top) - bar - 8) / lines.split('<br>').length;
  fitLine(h1, Math.min((phone ? .082 : .2) * h, free));
  root.style.setProperty('--band', bar + h1.offsetHeight * .97 + 'px');
  root.style.setProperty('--band2', bar + parseFloat(getComputedStyle($('#ribbon')).fontSize) * .92 + 'px');
  root.style.setProperty('--card', card + 'px');
}

// --- Камера над кадром: какая часть кадра на экране и насколько крупно --------------------------
const BOX = [775, 205, 1515, 1040];
const view = { k: 1, x: 0, y: 0 };
const apply = () => { rig.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; };

function place() {
  const w = root.clientWidth, h = pin.clientHeight, phone = w < 900;
  const css = (n) => parseFloat(getComputedStyle(root).getPropertyValue(n));
  const look = body.classList.contains('look');
  let k, x, y;
  if (look) {
    const [x0, y0, x1, y1] = BOX, top = css('--band2'), bw = x1 - x0, bh = y1 - y0;
    const bottom = phone ? h - $('.card-look').offsetHeight - 48 : h;
    k = Math.min((bottom - top - 16) / bh, (phone ? w - 8 : w * .9) / bw);
    const cx = phone ? w / 2 : Math.max(.62 * w, Math.min(w - bw * k / 2, 580 + bw * k / 2));
    x = cx - (x0 + bw / 2) * k;
    y = top + Math.max(8, (bottom - top - bh * k) / 2) - y0 * k;
    x = Math.max(x, w - 1920 * k);
    y = Math.max(Math.min(y, top), bottom - 1080 * k);
  } else {
    y = css('--band');
    k = phone ? .43 : Math.max(1.07 * w, 1920 * .7) / 1920;
    x = phone ? w / 2 - 1145 * k : Math.min(0, w - 1920 * k + 20);
  }
  Object.assign(view, { k, x, y });
  lifted = 0;
  apply();
}

function setLook(on) {
  if (on === body.classList.contains('look')) return;
  body.classList.toggle('look', on);
  if (!on) closeSheet();
  place();
}
function onScroll() {
  const h = pin.clientHeight;
  setLook(scrollY > h * .22);
  if (scrollY > h * .95) closeSheet();
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { fit(); place(); onScroll(); });

// --- Комнаты: контуры лежат в странице, отклик есть с первого касания ---------------------------
const SCALE = 1.5;
const [CX, CY, CW, CH] = CROP;
glow.width = CW * SCALE; glow.height = CH * SCALE;
Object.assign(glow.style, { left: CX + 'px', top: CY + 'px', width: CW + 'px', height: CH + 'px' });
const ctx = glow.getContext('2d');
ctx.setTransform(SCALE, 0, 0, SCALE, -CX * SCALE, -CY * SCALE);
const lit = new Image();
const litReady = () => lit.complete && lit.naturalWidth > 0;

function poly(flat) {
  const p = new Path2D();
  flat.forEach((v, i) => { if (i % 2) (i === 1 ? p.moveTo(flat[0], v) : p.lineTo(flat[i - 1], v)); });
  p.closePath();
  return p;
}
const rooms = ROOMS.map(([id, top, floor]) => {
  const all = poly(top);
  all.addPath(poly(floor));
  return { id, top, floor, line: poly(top), all, a: 0, on: false };
});
const byId = new Map(rooms.map((r) => [r.id, r]));

function inside(flat, x, y) {
  let hit = false;
  for (let i = 0, j = flat.length - 2; i < flat.length; j = i, i += 2) {
    if ((flat[i + 1] > y) !== (flat[j + 1] > y) && x < flat[i] + (flat[j] - flat[i]) * (y - flat[i + 1]) / (flat[j + 1] - flat[i + 1])) hit = !hit;
  }
  return hit;
}
function dist(flat, x, y) {
  let best = Infinity;
  for (let i = 0, j = flat.length - 2; i < flat.length; j = i, i += 2) {
    const ax = flat[j], ay = flat[j + 1], dx = flat[i] - ax, dy = flat[i + 1] - ay;
    const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
  }
  return best;
}
// Промах прощается: в коридоре и рядом со зданием загорается ближайшая комната
function roomAt(x, y, k) {
  const hit = rooms.find((r) => inside(r.floor, x, y)) || rooms.find((r) => inside(r.top, x, y));
  if (hit) return hit;
  let best = null, d = inside(OUTER, x, y) ? Infinity : 26 / k;
  for (const r of rooms) {
    const v = Math.min(dist(r.floor, x, y), dist(r.top, x, y));
    if (v < d) { d = v; best = r; }
  }
  return best;
}

// Загорается за 0,1 секунды, гаснет за 0,6 с замедлением
let running = false, last = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(now - last, 50));
  last = now;
  ctx.clearRect(CX, CY, CW, CH);
  let busy = false;
  for (const r of rooms) {
    if (r.on) r.a = still ? 1 : Math.min(1, r.a + dt / 100);
    else if (r.a) { r.a = still ? 0 : r.a * Math.exp(-dt / 150); if (r.a < .012) r.a = 0; }
    if (r.on ? r.a < 1 : r.a > 0) busy = true;
    if (r.a > 0) {
      ctx.save();
      ctx.globalAlpha = r.a;
      ctx.clip(r.all);
      if (litReady()) ctx.drawImage(lit, CX, CY, CW, CH);
      else { ctx.fillStyle = 'rgba(255,176,96,.38)'; ctx.fill(r.all); }
      ctx.restore();
    }
  }
  // Тонкая светлая линия вдоль верха стен, толщина на экране постоянная
  for (const r of rooms) {
    if (r.a > .02) {
      ctx.globalAlpha = r.a;
      ctx.strokeStyle = '#ffe2bd';
      ctx.lineWidth = 1.6 / view.k;
      ctx.lineJoin = 'round';
      ctx.stroke(r.line);
    }
  }
  ctx.globalAlpha = 1;
  if (busy) requestAnimationFrame(frame); else running = false;
}
function wake() {
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}

let hot = null, shown = null, lifted = 0;
function setHot(r) {
  if (r === hot) return;
  if (hot && hot !== shown) hot.on = false;
  hot = r;
  if (r) r.on = true;
  wake();
}

// --- Палец и мышь. Вниз страницу прокручивает сам браузер, вбок палец идёт по комнатам ------------
function point(e) {
  const b = rig.getBoundingClientRect(), k = b.width / 1920;
  return roomAt((e.clientX - b.left) / k, (e.clientY - b.top) / k, k);
}
rig.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') setHot(point(e));
});
rig.addEventListener('pointermove', (e) => setHot(point(e)));
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => rig.addEventListener(n, () => setHot(null)));
rig.addEventListener('click', (e) => {
  const r = point(e);
  if (!r) return;
  // На первом экране нажатие ведёт к макету, лист открывается уже там
  if (!body.classList.contains('look')) return $('#building').scrollIntoView();
  openSheet(r);
});

// Клавиатура: стрелки идут по комнатам, Enter открывает лист
let kbd = -1;
rig.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    kbd = (kbd + (e.key === 'ArrowRight' ? 1 : rooms.length - 1) + (kbd < 0 && e.key === 'ArrowLeft' ? 1 : 0)) % rooms.length;
    setHot(rooms[kbd]);
    $('#said').textContent = t().position(kbd + 1, rooms.length);
  } else if (e.key === 'Enter' && hot) openSheet(hot);
});
rig.addEventListener('focus', () => { if (rig.matches(':focus-visible')) setHot(rooms[Math.max(kbd, 0)]); });
rig.addEventListener('blur', () => setHot(null));

// --- Лист комнаты --------------------------------------------------------------------------
// Настоящие снимки офисов этого здания. Пока своего снимка у комнаты нет, номер комнаты выбирает один из них
const OFFICES = ['office-window', 'office-corner', 'office-blinds', 'office-narrow', 'office-glass'];
// Что известно про отдельную комнату. Цена и размер появятся в листе сами: 26: { price: '$700', size: '200 sq ft' }.
// Свой снимок: photo с именем файла из site/img и words со своей подписью, слова для неё добавить в TEXT, как у переговорной
const KNOWN = { 31: { photo: 'meeting-room', words: 'meeting' } };

function fillSheet(r) {
  const info = KNOWN[r.id] || {}, words = t()[info.words || 'office'], photo = info.photo || OFFICES[r.id % OFFICES.length];
  const img = $('#room-img'), facts = $('#room-facts'), note = $('#room-note');
  img.src = `img/${photo}-800.webp`; // снимок грузится только здесь, при открытии листа
  img.alt = t().alt[photo];
  $('#room-caption').textContent = words.caption;
  $('#room-title').textContent = words.title;
  facts.textContent = [info.price, info.size].filter(Boolean).join(', ');
  facts.hidden = !facts.textContent;
  note.textContent = words.note || '';
  note.hidden = !words.note;
}
function openSheet(r) {
  if (shown && shown !== r) shown.on = false;
  shown = r;
  r.on = true;
  fillSheet(r);
  if (!sheet.open) sheet.show();
  // Комната не должна оказаться под листом
  const low = Math.max(...r.floor.filter((_, i) => i % 2)) * view.k + view.y + lifted;
  const room = pin.clientHeight - sheet.offsetHeight - 12;
  const by = root.clientWidth < 900 && low > room ? low - room : 0;
  view.y += lifted - by;
  lifted = by;
  apply();
  wake();
}
function closeSheet() {
  if (!shown) return;
  shown.on = shown === hot;
  shown = null;
  if (sheet.open) sheet.close();
  view.y += lifted;
  lifted = 0;
  apply();
  if (kbd >= 0) rig.focus({ preventScroll: true });
  wake();
}
$('#close').addEventListener('click', closeSheet);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSheet(); $('#menu').open = false; }
});

// --- Мелочи: меню закрывается, рамка остаётся только для клавиатуры ------------------------------
$$('.drop a').forEach((a) => a.addEventListener('click', () => { $('#menu').open = false; }));
document.addEventListener('click', (e) => {
  if (!e.target.closest('#menu')) $('#menu').open = false;
  // После tel: окно получает фокус обратно, и браузер рисует рамку; при нажатии мышью или пальцем фокус снимаем
  if (e.detail > 0) { const f = e.target.closest('a,button,summary'); if (f) f.blur(); }
});
$$('a[href="#stage"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); }));

// --- Табличка IN USE загорается, когда заголовок показался. При «меньше движения» она просто горит ---
if (!still && 'IntersectionObserver' in window) {
  const sign = $('#past-title');
  sign.classList.add('off');
  new IntersectionObserver(([e], seen) => {
    if (e.isIntersecting) { sign.classList.replace('off', 'flick'); seen.disconnect(); }
  }, { threshold: .8 }).observe(sign);
}

// --- Старт ---------------------------------------------------------------------------------
const saved = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
const asked = new URLSearchParams(location.search).get('lang');
const ru = (navigator.languages || [navigator.language]).some((l) => /^(ru|uk|be)/i.test(l));
setLang(asked === 'en' || asked === 'ru' ? asked : saved || (ru ? 'ru' : 'en'));
onScroll();
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('on')));
if (document.fonts) document.fonts.ready.then(() => { fit(); place(); });
// Тяжёлый свет грузится после первого экрана
addEventListener('load', () => setTimeout(() => { lit.src = 'img/maket-svet.webp'; }, 300));
