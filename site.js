const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const body = document.body, pin = $('#pin'), rig = $('#rig'), glow = $('#glow'), sheet = $('#sheet'), root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;

// --- Язык: русский текст в разметке, английский в data-en ------------------------------------
const TEXT = {
  ru: { room: 'Комната', onPlan: (n, p) => `Это комната ${n} на нашем плане, ${p} часть здания.`, n: 'северная', s: 'южная',
    sms: 'Здравствуйте! Интересует офис на 5345 Madison Ave. Что сейчас свободно?',
    smsRoom: (n, p) => `Здравствуйте! Смотрю на сайте комнату ${n} на плане, ${p} часть здания. Подскажите цену, размер и свободна ли она?`,
    title: 'Офисы в аренду в Сакраменто от $500 в месяц | Madison Business Center', other: 'English', sw: 'EN' },
  en: { room: 'Room', onPlan: (n, p) => `This is room ${n} on our plan, in the ${p} part of the building.`, n: 'north', s: 'south',
    sms: "Hi! I'm interested in an office at 5345 Madison Ave. What's available now?",
    smsRoom: (n, p) => `Hi! I'm looking at room ${n} on the plan on your site, ${p} part of the building. Can you tell me its price, size and whether it's open?`,
    title: 'Offices for rent in Sacramento from $500 a month | Madison Business Center', other: 'Русский', sw: 'RU' },
};
const smsLink = (text) => `sms:+19169144407?&body=${encodeURIComponent(text)}`;
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
  $$('.sms').forEach((a) => { a.href = smsLink(t().sms); });
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
  const size = fitLine(h1, (phone ? .082 : .2) * h);
  root.style.setProperty('--band', bar + h1.offsetHeight * .97 + 'px');
  const big = fitLine($('#ribbon'), (phone ? .2 : .34) * h);
  root.style.setProperty('--band2', bar + big * .76 + 'px');
  root.style.setProperty('--card', (body.classList.contains('look') ? $('.card-look') : $('.card-hero')).offsetHeight + 'px');
  return size;
}

// --- Камера над кадром: какая часть кадра на экране и насколько крупно --------------------------
const BOX = { all: [775, 205, 1515, 1040], north: [775, 205, 1515, 600], south: [805, 555, 1450, 1040] };
const view = { k: 1, x: 0, y: 0, min: 0, max: 0 };
let part = 'all';
const apply = () => { rig.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; };

function place() {
  const w = root.clientWidth, h = pin.clientHeight, phone = w < 900;
  const css = (n) => parseFloat(getComputedStyle(root).getPropertyValue(n));
  const look = body.classList.contains('look');
  root.style.setProperty('--card', (look ? $('.card-look') : $('.card-hero')).offsetHeight + 'px');
  let k, x, y;
  view.min = view.max = 0;
  if (look) {
    const [x0, y0, x1, y1] = BOX[part], top = css('--band2'), bw = x1 - x0, bh = y1 - y0;
    const bottom = phone ? h - $('.card-look').offsetHeight - 48 : h;
    if (part === 'all') k = Math.min((bottom - top - 16) / bh, (phone ? w - 8 : w * .9) / bw);
    else k = Math.min((bottom - top - 16) / bh, phone ? .85 : 1.35 * Math.max(1, w / 1920));
    const cx = phone ? w / 2 : Math.max(.62 * w, Math.min(w - bw * k / 2, 580 + bw * k / 2));
    x = cx - (x0 + bw / 2) * k;
    y = top + Math.max(8, (bottom - top - bh * k) / 2) - y0 * k;
    x = Math.max(x, w - 1920 * k);
    y = Math.max(Math.min(y, top), bottom - 1080 * k);
    // Часть здания шире экрана телефона: палец вбок сдвигает её
    if (phone && bw * k > w) { view.min = w - 8 - x1 * k; view.max = 8 - x0 * k; x = (view.min + view.max) / 2; }
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
function setPart(p) {
  part = p;
  body.dataset.part = p;
  $$('.tabs-look .tab').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === p)));
  place();
}
$$('.tabs-look .tab').forEach((b) => b.addEventListener('click', () => setPart(b.dataset.part)));
function onScroll() {
  const h = pin.clientHeight;
  setLook(scrollY > h * .22);
  if (scrollY > h * 1.25) closeSheet();
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
const rooms = ROOMS.map(([id, side, top, floor]) => {
  const all = poly(top);
  all.addPath(poly(floor));
  return { id, side, top, floor, line: poly(top), all, a: 0, on: false };
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
let px = null;
rig.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') { px = e.clientX; setHot(point(e)); }
});
rig.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' && px !== null && view.max > view.min) {
    view.x = Math.max(view.min, Math.min(view.max, view.x - (e.clientX - px) * (view.max - view.min) / root.clientWidth));
    px = e.clientX;
    rig.classList.add('pan');
    apply();
  }
  setHot(point(e));
});
const leave = () => { px = null; rig.classList.remove('pan'); setHot(null); };
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => rig.addEventListener(n, leave));
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
    $('#said').textContent = `${t().room} ${rooms[kbd].id}`;
  } else if (e.key === 'Enter' && hot) openSheet(hot);
});
rig.addEventListener('focus', () => { if (rig.matches(':focus-visible')) setHot(rooms[Math.max(kbd, 0)]); });
rig.addEventListener('blur', () => setHot(null));

// --- Лист комнаты --------------------------------------------------------------------------
function fillSheet(r) {
  const side = t()[r.side];
  $('#room-title').textContent = `${t().room} ${r.id}`;
  $('#room-where').textContent = t().onPlan(r.id, side);
  $('#room-sms').href = smsLink(t().smsRoom(r.id, side));
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
  // После tel: и sms: окно получает фокус обратно, и браузер рисует рамку; при нажатии мышью или пальцем фокус снимаем
  if (e.detail > 0) { const f = e.target.closest('a,button,summary'); if (f) f.blur(); }
});
$$('a[href="#stage"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); }));

// --- Старт ---------------------------------------------------------------------------------
setPart('all');
const saved = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
const asked = new URLSearchParams(location.search).get('lang');
const ru = (navigator.languages || [navigator.language]).some((l) => /^(ru|uk|be)/i.test(l));
setLang(asked === 'en' || asked === 'ru' ? asked : saved || (ru ? 'ru' : 'en'));
onScroll();
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('on')));
if (document.fonts) document.fonts.ready.then(() => { fit(); place(); });
// Тяжёлый свет грузится после первого экрана
addEventListener('load', () => setTimeout(() => { lit.src = 'img/maket-svet.webp'; }, 300));
