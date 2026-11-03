const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const body = document.body, plan = $('#building'), planStage = $('#plan-stage'), rig = $('#rig'), glow = $('#glow'), sheet = $('#sheet'), root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;

// --- Язык: русский текст в разметке, английский в data-en ------------------------------------
const TEXT = {
  ru: { position: (n, total) => `Комната ${n} из ${total}`,
    office: { caption: 'Один из офисов в этом здании. Снимка именно этой комнаты пока нет.', title: 'Цену, размер и что свободно, можно узнать по телефону или в WhatsApp.' },
    meeting: { caption: 'Переговорная в этом здании. Где она на макете, подскажем по телефону.', title: 'Ею могут пользоваться все арендаторы', note: 'Цену офиса, размер и что свободно, можно узнать по телефону или в WhatsApp.' },
    any: 'Офис в этом здании', known: 'Что свободно, можно узнать по телефону или в WhatsApp.',
    alt: { 'office-window': 'Пустой офис с большим окном', 'office-corner': 'Пустой угловой офис: окна на две стены, низ матовый, верх прозрачный, тёмный ковёр', 'office-blinds': 'Пустой угловой офис с жалюзи на окнах', 'office-narrow': 'Пустой офис с жёлтой и коричневой стенами и жалюзи', 'office-glass': 'Пустой офис за стеклянной стеной, за окном деревья', 'meeting-room': 'Переговорная с длинным столом и креслами' },
    message: 'Здравствуйте! Интересует офис на 5345 Madison Ave. Подскажите цену, размер и что сейчас свободно?',
    title: 'Офисы в аренду в Сакраменто от $500 в месяц | Madison Business Center', other: 'English', sw: 'EN' },
  en: { position: (n, total) => `Room ${n} of ${total}`,
    office: { caption: "One of the offices in this building. We don't have a photo of this exact room yet.", title: 'Call or message us for the price, size and availability.' },
    meeting: { caption: 'The conference room in this building. We can show you where it is on the model.', title: 'Any tenant can use it', note: 'Call or message us for office prices, sizes and availability.' },
    any: 'An office in this building', known: "Call or message us to find out what's available.",
    alt: { 'office-window': 'Empty office with a large window', 'office-corner': 'Empty corner office with windows on two walls, frosted below and clear above, and a dark carpet', 'office-blinds': 'Empty corner office with blinds on the windows', 'office-narrow': 'Empty office with yellow and brown walls and blinds', 'office-glass': 'Empty office behind a glass wall, with trees outside', 'meeting-room': 'Conference room with a long table and chairs' },
    message: "Hi! I'm interested in an office at 5345 Madison Ave. Can you tell me the price, the size and what's available now?",
    title: 'Offices for rent in Sacramento from $500 a month | Madison Business Center', other: 'Русский', sw: 'RU' },
};
const waLink = (text) => `https://wa.me/19169144407?text=${encodeURIComponent(text)}`;
const t = () => TEXT[root.lang];
$$('[data-en]').forEach((e) => { e.dataset.ru = e.innerHTML; });
$$('[data-en-label]').forEach((e) => { e.dataset.ruLabel = e.getAttribute('aria-label'); });
$$('[data-en-alt]').forEach((e) => { e.dataset.ruAlt = e.alt; });

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
  place();
}
$('#lang').addEventListener('click', () => setLang(root.lang === 'en' ? 'ru' : 'en'));

// --- Камера над кадром: какая часть кадра на экране и насколько крупно --------------------------
const BOX = [775, 205, 1515, 1040];
const view = { k: 1, x: 0, y: 0 };
const apply = () => { rig.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; };
// Телефон стоймя: заголовок сверху, макет крупнее ширины экрана, его можно двигать пальцем вбок
const tall = () => matchMedia('(max-width:899px) and (orientation:portrait)').matches;

function place() {
  const w = plan.clientWidth, h = plan.clientHeight, [x0, y0, x1, y1] = BOX, bw = x1 - x0, bh = y1 - y0;
  const head = tall() ? $('.plan-head').offsetHeight : 0, room = h - head;
  planStage.style.top = head + 'px';
  // Сбоку от макета остаётся место для заголовка: левый край стола на его высоте примерно на 480 в кадре
  const free = $('.plan-head').offsetLeft + $('.plan-head').offsetWidth + 16;
  // Кадр всегда выше экрана: его верх и низ обрезаны ровной линией и показаться не должны
  const k = tall() ? Math.min((room - 12) / bh, w * 1.38 / bw) : Math.max(h / 1080, Math.min((h - 32) / bh, 1.3, (w - free) / (x1 - 480)));
  const cx = tall() ? w / 2 : Math.min(w - bw * k / 2 - 8, Math.max(w * .68, free + (x0 + bw / 2 - 480) * k));
  Object.assign(view, { k, x: cx - (x0 + bw / 2) * k, y: Math.max(Math.max(tall() ? 4 : 16, (room - bh * k) / 2) - y0 * k, room - 1080 * k) });
  lifted = 0;
  rig.style.transition = 'none'; // на свои места сразу, плавно едет только подъём под лист
  if (shown) lift(shown); else apply();
  rig.offsetWidth;
  rig.style.transition = '';
  fitLive();
}
// Страницу двинули дальше: лист уходит сразу, чтобы прокрутка не казалась зависшей
addEventListener('scroll', () => { if (Math.abs(scrollY - sheetAt) > 40) closeSheet(true); }, { passive: true });
addEventListener('resize', place);

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
  if (drawNudge(now)) busy = true;
  if (busy) requestAnimationFrame(frame); else running = false;
}
function wake() {
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}

let hot = null, shown = null, lifted = 0, sheetAt = Infinity;
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
// Палец двигает крупный макет вбок, короткое нажатие открывает комнату
let dragX = null, dragged = false;
rig.addEventListener('pointerdown', (e) => {
  dragged = false;
  if (e.pointerType === 'mouse') return;
  setHot(point(e));
  if (hot) hot.a = 1; // палец: комната горит сразу, без нарастания
  dragX = tall() ? e.clientX : null;
  rig.style.transition = 'none';
});
rig.addEventListener('pointermove', (e) => {
  setHot(point(e));
  if (e.pointerType === 'mouse') rig.classList.toggle('over', !!hot); // рука только над комнатой
  if (dragX === null) return;
  const by = e.clientX - dragX;
  if (Math.abs(by) < 4 && !dragged) return;
  dragged = true;
  dragX = e.clientX;
  view.x = Math.min(8 - BOX[0] * view.k, Math.max(plan.clientWidth - 8 - BOX[2] * view.k, view.x + by));
  apply();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => rig.addEventListener(n, () => { setHot(null); dragX = null; rig.style.transition = ''; }));
rig.addEventListener('click', (e) => {
  if (dragged) return;
  const r = point(e);
  if (r) openSheet(r);
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
// Что известно про отдельную комнату. Цена и размер появятся в листе сами, как записать, в README.
// Свой снимок: photo с именем файла из site/img и words со своей подписью, слова для неё добавить в TEXT, как у переговорной
const KNOWN = { 31: { photo: 'meeting-room', words: 'meeting' } };

function fillSheet(r) {
  const info = KNOWN[r.id] || {}, words = t()[info.words || 'office'], photo = info.photo || OFFICES[r.id % OFFICES.length];
  const img = $('#room-img'), facts = $('#room-facts'), note = $('#room-note');
  img.src = `img/${photo}-800.webp`; // снимок грузится только здесь, при открытии листа
  img.alt = t().alt[photo] || t().any;
  $('#room-caption').textContent = words.caption;
  $('#room-title').textContent = info.price && !info.words ? t().known : words.title;
  facts.textContent = [info.price, info.size].filter(Boolean).join(', ');
  facts.hidden = !facts.textContent;
  note.textContent = words.note || '';
  note.hidden = !words.note;
}
// Комната не должна оказаться под листом
function lift(r) {
  const low = Math.max(...r.floor.filter((_, i) => i % 2)) * view.k + view.y + lifted + planStage.getBoundingClientRect().top;
  const room = innerHeight - sheet.offsetHeight - 12;
  const by = tall() && low > room ? low - room : 0;
  view.y += lifted - by;
  lifted = by;
  apply();
}
function openSheet(r) {
  if (shown && shown !== r) shown.on = false;
  shown = r;
  r.on = true;
  fillSheet(r);
  if (!sheet.open) {
    sheet.show();
    sheetAt = scrollY;
    history.pushState({ sheet: 1 }, ''); // кнопка «Назад» на телефоне закрывает лист, а не уводит с сайта
  }
  lift(r);
  wake();
}
// keep: лист закрыла прокрутка или сам «Назад», возвращаться по истории не надо, страница прыгнула бы
function closeSheet(keep) {
  if (!shown) return;
  shown.on = shown === hot;
  shown = null;
  sheetAt = Infinity;
  if (sheet.open) sheet.close();
  view.y += lifted;
  lifted = 0;
  apply();
  if (kbd >= 0) rig.focus({ preventScroll: true }); else rig.blur();
  if (!keep && history.state?.sheet) history.back();
  wake();
}
$('#close').addEventListener('click', () => closeSheet());
addEventListener('popstate', () => closeSheet(true));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSheet(); $('#menu').open = false; }
});

// --- Заявка: подпись поднимается над полем, телефон проверяется. Куда отправлять, задаётся в content/texts.toml, раздел [form] -----
const lead = $('#lead'), leadPhone = $('#lead-phone'), leadBad = $('#lead-bad'), leadOff = $('#lead-off');
const phoneOk = () => { const n = leadPhone.value.replace(/\D/g, '').length; return n >= 10 && n <= 15; };
leadPhone.addEventListener('input', () => {
  const box = leadPhone.parentElement;
  box.classList.toggle('good', phoneOk());
  if (phoneOk()) { box.classList.remove('bad'); leadBad.hidden = true; leadPhone.removeAttribute('aria-invalid'); }
});
lead.addEventListener('submit', (e) => {
  e.preventDefault();
  leadOff.hidden = true;
  if (!phoneOk()) {
    leadPhone.parentElement.classList.add('bad');
    leadBad.hidden = false;
    leadPhone.setAttribute('aria-invalid', 'true');
    leadPhone.focus();
    return;
  }
  // ponytail: отправки ещё нет, почта не выбрана (PROJECT_STATE.md). Поэтому заявка не считается принятой: человек видит, что надо позвонить
  leadOff.hidden = false;
  leadOff.scrollIntoView({ block: 'nearest' });
});
// Форма лежит в листе и открывается кнопкой «Записаться на просмотр»
const ask = $('#ask');
$('#book').addEventListener('click', () => ask.showModal());
$('#ask-close').addEventListener('click', () => ask.close());

// --- Страница ниже плана: снимок растёт и отстаёт от страницы, строки выезжают. Числа сняты с оригинала, research/дизайн/ОРИГИНАЛ-как-устроен.md -----
const growing = $$('.grow');

// Большой снимок растёт с 66% (на телефоне с 88%), пока его середина идёт от края экрана до 45% высоты, и движется чуть медленнее страницы
function flowFrame() {
  growing.forEach((f) => {
    const height = f.offsetHeight, centre = f.parentElement.getBoundingClientRect().top + height / 2;
    if (centre < -height || centre > innerHeight + height * 1.5) return;
    const from = innerHeight + height * .33, to = innerHeight * .45, small = innerWidth < 900 ? .88 : .66;
    const grown = Math.min(1, Math.max(0, (from - centre) / (from - to)));
    f.style.transform = `translate3d(0,${((centre - innerHeight / 2) * .045).toFixed(1)}px,0) scale(${(small + (1 - small) * grown).toFixed(4)})`;
  });
}
// Ворота: рисунок разрезан на полосы, как фигуры в оригинале. Полосы разъехались вверх и вниз и съезжаются в здание, встаёт солнце, потом ворота откатываются. Назад всё обратно
const room = $('.scene-room'), stage = $('.scene'), set = $('.set'), sun = $('.sun'), gateLayer = $('.gt');
let strips = null;
function cutScene() {
  const n = innerWidth < 900 ? 9 : 16;
  strips = [...Array(n)].map((_, i) => {
    const b = document.createElement('b');
    b.style.cssText = `left:${i * 100 / n}%;width:calc(${100 / n}% + 1px);background-size:${n * 100}% 100%;background-position:${i * 100 / (n - 1)}% 0`;
    const k = (i * .618) % 1;
    b.far = (i % 2 ? 1 : -1) * (.3 + .4 * k);
    b.from = ((i * .382) % 1) * .22;
    set.insertBefore(b, gateLayer);
    return b;
  });
  stage.classList.add('cut');
}
const toEase = (v) => 1 - (1 - v) ** 3;
function sceneFrame() {
  const box = room.getBoundingClientRect();
  if (box.bottom < -innerHeight || box.top > innerHeight * 2) return;
  if (!strips) cutScene();
  const tall = stage.offsetHeight, p = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - tall)));
  strips.forEach((b) => {
    const left = 1 - toEase(Math.min(1, Math.max(0, (p - b.from) / .3)));
    b.style.transform = `translate3d(0,${(b.far * tall * left).toFixed(1)}px,0)`;
  });
  const open = Math.min(1, Math.max(0, (p - .55) / .38));
  gateLayer.style.transform = `translate3d(${(open * open * (3 - 2 * open) * 43).toFixed(2)}%,0,0)`;
  sun.style.transform = `translate3d(0,${((1 - toEase(Math.min(1, p / .6))) * 160).toFixed(1)}%,0)`;
  set.style.transform = `scale(${(1 + .05 * p).toFixed(4)})`;
}
if (!still) {
  let flowQueued = false;
  addEventListener('scroll', () => {
    if (flowQueued) return;
    flowQueued = true;
    requestAnimationFrame(() => { flowQueued = false; flowFrame(); sceneFrame(); });
  }, { passive: true });
  addEventListener('resize', () => { flowFrame(); sceneFrame(); });
  flowFrame();
  sceneFrame();
}

// Строки выезжают снизу на свою высоту по очереди. Разбивка только на время движения, потом текст снова целый и переносится сам
function splitLines(e) {
  const whole = e.innerHTML, words = e.textContent.trim().split(' ');
  e.innerHTML = words.map((w) => `<span>${w}</span>`).join(' ');
  const rows = [];
  [...e.children].forEach((w, i) => {
    if (!rows.length || w.offsetTop > rows.at(-1).top + 4) rows.push({ top: w.offsetTop, words: [] });
    rows.at(-1).words.push(words[i]);
  });
  e.innerHTML = rows.map((r) => `<span class="ln">${r.words.join(' ')}</span>`).join(' ');
  return { whole, lines: [...e.children] };
}
const EASE = 'cubic-bezier(.165,.84,.44,1)';
function riseUp(block) {
  block.classList.remove('wait');
  if (block.matches('.acts, .deco')) {
    block.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1200, easing: EASE });
    return;
  }
  let n = 0;
  (block.matches('.rent') ? [...block.children] : [block]).forEach((e) => {
    const { whole, lines } = splitLines(e);
    const moves = lines.map((l) => l.animate(
      [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 800, delay: 100 * n++, easing: EASE, fill: 'backwards' },
    ));
    moves.at(-1).finished.then(() => { if (e.querySelector('.ln')) e.innerHTML = whole; }).catch(() => {});
  });
}
if (!still && 'IntersectionObserver' in window) {
  const rising = new IntersectionObserver((seen) => seen.forEach((s) => {
    if (!s.isIntersecting && s.boundingClientRect.top > 0) return;
    rising.unobserve(s.target);
    riseUp(s.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rise').forEach((e) => { e.classList.add('wait'); rising.observe(e); });
}
// --- Стык первого экрана и макета. Чем дальше макет от своего места, тем выше над ним дымка цвета страницы, поэтому верхнего края у него не видно. Заодно макет чуть вырастает и в комнатах постепенно загорается свет. Всё считается только от прокрутки, сама она ничем не задерживается ---
// from размер макета в начале, haze высота дымки от пройденного пути
const ARRIVE = { from: .9, haze: .5 };
const veil = $('#veil'), nearBox = $('#near');
let lightsOn = still ? 1 : 0;

function arrive() {
  const away = Math.max(0, plan.getBoundingClientRect().top), h = plan.offsetHeight || 1;
  veil.style.transform = `scaleY(${Math.min(1, away * ARRIVE.haze / h).toFixed(4)})`;
  if (still) return;
  const near = Math.max(0, 1 - away / (innerHeight * .95));
  nearBox.style.transform = `scale(${(ARRIVE.from + (1 - ARRIVE.from) * toEase(near)).toFixed(4)})`;
  lightsOn = near;
}
let arriveQueued = false;
addEventListener('scroll', () => {
  if (arriveQueued) return;
  arriveQueued = true;
  requestAnimationFrame(() => { arriveQueued = false; arrive(); });
}, { passive: true });
addEventListener('resize', arrive);
arrive();
// --- Живой макет: свет идёт волной от комнаты к комнате, кроны сдвигаются от прокрутки, как объём при смене взгляда. Видеокарта считает один проход по видимой части кадра; нет видеокарты или «меньше движения», остаётся обычный снимок -----
// Настройка одной строкой. warm и cool множители к кадру со светом, coolShare доля комнат с прохладным светом, rest свет между волнами, strength сила, seconds за сколько волна возвращается в ту же комнату
const BREATH = { warm: [1.06, 1, .92], cool: [.66, .86, 1.3], coolShare: .12, rest: .12, strength: .9, seconds: 11 };
// Сдвиг самых высоких крон в точках кадра, когда макет на экран от своего места; sideways доля вбок. Низкие кроны сдвигаются меньше, пока страница стоит, стоят и деревья
const TREES = { px: 20, sideways: -.33 };

const LIVE_VERTEX = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const LIVE_FRAGMENT = `#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform sampler2D img, map, svet, mask;
  uniform vec4 box, crop;
  uniform vec3 warm, cool;
  uniform vec2 shift;
  uniform float beat, rest, strength, on;
  varying vec2 v;
  // Высота над землёй берётся только у деревьев: красный канал высота, зелёный где дерево
  float crown(vec2 p) {
    vec4 d = texture2D(map, p);
    return smoothstep(.5, .9, d.g) * max(0., d.r - .62) / .38; // стены рядом с кроной не гнутся
  }
  void main() {
    vec2 f = box.xy + vec2(v.x, 1. - v.y) * box.zw;
    vec2 q = f / vec2(1920., 1080.);
    // Луч идёт сверху вниз, пока не встретит крону: высокие части сдвигаются больше низких, край кроны не рвётся. Вся работа только рядом с деревьями
    if (texture2D(map, q).g + texture2D(map, q - shift).g > .02) {
      float h = 1., gap = 1. - crown(q - shift), low = 0., under = 0.;
      for (int i = 0; i < 6; i++) {
        low = h - 1. / 6.;
        under = low - crown(q - shift * low);
        if (under <= 0.) break;
        h = low;
        gap = under;
      }
      q -= shift * (h - (h - low) * gap / max(gap - under, .0001));
    }
    vec4 c = texture2D(img, q);
    vec2 r = (f - crop.xy) / crop.zw;
    if (r.x > 0. && r.y > 0. && r.x < 1. && r.y < 1.) {
      vec4 m = texture2D(mask, r);
      if (m.a > 0.) {
        float wave = .5 + .5 * sin(6.2832 * (beat - 2. * m.r));
        float amount = m.a * strength * (rest + (1. - rest) * wave * wave * wave) * smoothstep(m.r - .15, m.r + .15, on * 1.3 - .15);
        c.rgb = mix(c.rgb, texture2D(svet, r).rgb * mix(warm, cool, m.g), amount);
      }
    }
    gl_FragColor = c;
  }`;
let live; // пока не готов; null, когда без него

// У каждой комнаты своё место в волне: сверху вниз по зданию и чуть вразнобой. Красный канал это место в волне, зелёный прохладный свет
function roomMask() {
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  g.translate(-CX, -CY);
  rooms.forEach((r) => {
    const ys = r.floor.filter((_, i) => i % 2), down = (ys.reduce((a, b) => a + b) / ys.length - CY) / CH;
    const place = .8 * down + .2 * ((r.id * .618) % 1), cold = (r.id * .382) % 1 < BREATH.coolShare ? 255 : 0;
    g.fillStyle = `rgb(${Math.round(place * 255)},${cold},0)`;
    g.fill(r.all);
  });
  return c;
}

function makeLive(depth) {
  const canvas = document.createElement('canvas');
  canvas.className = 'alive';
  const gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  const program = gl.createProgram();
  [[gl.VERTEX_SHADER, LIVE_VERTEX], [gl.FRAGMENT_SHADER, LIVE_FRAGMENT]].forEach(([type, src]) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(program, s);
  });
  gl.bindAttribLocation(program, 0, 'a');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (name) => gl.getUniformLocation(program, name);
  [['img', rig.querySelector('img'), true], ['map', depth, false], ['svet', lit, false], ['mask', roomMask(), false]].forEach(([name, pic, clear], unit) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, clear);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u(name), unit);
  });
  gl.uniform4f(u('crop'), CX, CY, CW, CH);
  gl.uniform3fv(u('warm'), BREATH.warm);
  gl.uniform3fv(u('cool'), BREATH.cool);
  gl.uniform1f(u('rest'), BREATH.rest);
  gl.uniform1f(u('strength'), BREATH.strength);
  // Телефон может отобрать видеопамять: тогда под холстом обычный снимок
  canvas.addEventListener('webglcontextlost', () => { canvas.remove(); live = null; });
  rig.insertBefore(canvas, glow);
  return { canvas, gl, uBox: u('box'), uShift: u('shift'), uBeat: u('beat'), uOn: u('on') };
}
// Холст только на ту часть кадра, что видна на этом экране, с запасом. Точек столько, сколько даёт сам кадр, остальное дорисует браузер
function fitLive() {
  if (!live) return;
  const { k, x, y } = view, m = 60;
  const x0 = Math.max(0, Math.floor(tall() ? BOX[0] - m : -x / k - m)), x1 = Math.min(1920, Math.ceil(tall() ? BOX[2] + m : (plan.clientWidth - x) / k + m));
  const y0 = Math.max(0, Math.floor(-y / k - m)), w = x1 - x0, h = 1080 - y0, sharp = Math.min(1, k * devicePixelRatio);
  Object.assign(live.canvas.style, { left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: h + 'px' });
  live.canvas.width = Math.round(w * sharp);
  live.canvas.height = Math.round(h * sharp);
  live.gl.viewport(0, 0, live.canvas.width, live.canvas.height);
  live.gl.uniform4f(live.uBox, x0, y0, w, h);
}
let liveSeen = false, liveBefore = 0, treesNow = null;
function liveFrame(now) {
  if (!liveSeen || !live) return;
  requestAnimationFrame(liveFrame);
  if (now - liveBefore < 30) return; // тридцати кадров хватает, телефон не греется
  // Цель зависит только от положения прокрутки, сдвиг плавно её догоняет
  const treesAim = Math.max(-1, Math.min(1, plan.getBoundingClientRect().top / innerHeight)) * TREES.px;
  treesNow = treesNow === null ? treesAim : treesNow + (treesAim - treesNow) * (1 - .925 ** (Math.min(now - liveBefore, 50) / 16.7));
  liveBefore = now;
  live.gl.uniform2f(live.uShift, TREES.sideways * treesNow / 1920, treesNow / 1080);
  live.gl.uniform1f(live.uBeat, (now / 1000 / BREATH.seconds) % 1);
  live.gl.uniform1f(live.uOn, lightsOn);
  live.gl.drawArrays(live.gl.TRIANGLES, 0, 3);
}
if (!still) {
  const depth = new Image();
  depth.src = 'img/maket-depth.webp';
  Promise.all([depth.decode(), new Promise((done) => lit.addEventListener('load', done, { once: true }))]).then(() => {
    live = makeLive(depth);
    if (!live) return;
    fitLive();
    new IntersectionObserver(([e]) => {
      const was = liveSeen;
      liveSeen = e.isIntersecting;
      if (liveSeen && !was) requestAnimationFrame(liveFrame);
    }).observe(plan);
  }).catch(() => { live = null; });
} else live = null;
// --- Подсказка без слов: сам макет показывает, что на комнату можно нажать. Комната загорается, чуть приподнимается, на ней расходится круг. Первое действие человека её выключает, остаётся дыхание ---
// ms одна комната, gap пауза между комнатами, total сколько комнат показать и замолчать, lift подъём и ring радиус круга в точках экрана
const NUDGE = { ms: 2100, gap: 1500, total: 8, lift: 7, ring: 46 };
let nudge = null, nudgesLeft = NUDGE.total, nudgeTimer = 0, nudgeBag = [];

const nudgeSeen = () => plan.getBoundingClientRect().top < innerHeight * .35 && plan.getBoundingClientRect().bottom > innerHeight * .65;
// Комнаты вперемешку: каждая покажется только после всех остальных, с листа и в углах не показываем
function nextNudge() {
  const b = rig.getBoundingClientRect(), k = b.width / 1920, head = $('.plan-head').getBoundingClientRect();
  if (!nudgeBag.length) {
    nudgeBag = [...rooms];
    for (let i = nudgeBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nudgeBag[i], nudgeBag[j]] = [nudgeBag[j], nudgeBag[i]];
    }
  }
  for (let i = nudgeBag.length - 1; i >= 0; i--) {
    const r = nudgeBag[i], xs = r.floor.filter((_, n) => !(n % 2)), ys = r.floor.filter((_, n) => n % 2);
    const x = xs.reduce((a, c) => a + c) / xs.length, y = ys.reduce((a, c) => a + c) / ys.length;
    const sx = b.left + x * k, sy = b.top + y * k, reach = NUDGE.ring + 16;
    if (sx < reach || sx > innerWidth - reach || sy < Math.max(reach, tall() ? head.bottom + reach : 96) || sy > innerHeight - reach) continue;
    if (x - CX < reach / k || x > CX + CW - reach / k || y - CY < reach / k || y > CY + CH - reach / k) continue;
    nudgeBag.splice(i, 1);
    return { room: r, x, y };
  }
  nudgeBag = [];
  return null;
}
function playNudge() {
  clearTimeout(nudgeTimer);
  if (nudgesLeft <= 0 || live === null) return;
  const next = live && nudgeSeen() && !hot && !shown ? nextNudge() : null;
  if (!next) { nudgeTimer = setTimeout(playNudge, 700); return; }
  nudgesLeft--;
  nudge = { ...next, at: performance.now() };
  wake();
}
function hushNudge() {
  nudgesLeft = 0;
  clearTimeout(nudgeTimer);
}
// Рисует rooms.js в своём кадре, отвечает, идёт ли ещё движение
function drawNudge(now) {
  if (!nudge) return false;
  const age = (now - nudge.at) / NUDGE.ms;
  if (age >= 1) {
    nudge = null;
    if (nudgesLeft > 0) nudgeTimer = setTimeout(playNudge, NUDGE.gap);
    return false;
  }
  if (age < 0) return true;
  const { room, x, y } = nudge;
  // Быстро загорается, долго гаснет
  const glowAt = age < .2 ? toEase(age / .2) : 1 - (Math.max(0, age - .4) / .6) ** 2;
  const up = NUDGE.lift * glowAt / view.k;
  ctx.save();
  ctx.globalAlpha = glowAt * .4;
  ctx.fillStyle = '#1c0d04';
  ctx.fill(room.all);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -up);
  ctx.globalAlpha = glowAt;
  ctx.save();
  ctx.clip(room.all);
  if (litReady()) ctx.drawImage(lit, CX, CY, CW, CH);
  ctx.globalCompositeOperation = 'screen'; // заметнее дышащих соседей
  ctx.fillStyle = 'rgba(255,190,120,.26)';
  ctx.fill(room.all);
  ctx.restore();
  ctx.strokeStyle = '#ffe2bd';
  ctx.lineWidth = 1.6 / view.k;
  ctx.lineJoin = 'round';
  ctx.stroke(room.line);
  ctx.restore();
  // Круг расходится как от касания, начинается, когда комната уже загорелась
  const spread = Math.max(0, (age - .14) / .62);
  if (spread > 0 && spread < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - spread) ** 1.5 * .9;
    ctx.strokeStyle = '#fff4e4';
    ctx.lineWidth = 2 / view.k;
    ctx.beginPath();
    ctx.arc(x, y - up, (10 + (NUDGE.ring - 10) * toEase(spread)) / view.k, 0, 6.2832);
    ctx.stroke();
    ctx.restore();
  }
  return true;
}
// Человек сам взялся за макет: мышь над ним, нажатие, стрелки или палец вбок. Прокрутка не считается
rig.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || dragged) hushNudge(); });
rig.addEventListener('click', hushNudge);
rig.addEventListener('keydown', hushNudge);
if (!still) {
  let started = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started) { started = true; nudgeTimer = setTimeout(playNudge, 500); }
  }, { threshold: .4 }).observe(planStage);
}
// --- Мелочи: меню закрывается, рамка остаётся только для клавиатуры ------------------------------
$$('.drop a').forEach((a) => a.addEventListener('click', () => { $('#menu').open = false; }));
document.addEventListener('click', (e) => {
  if (!e.target.closest('#menu')) $('#menu').open = false;
  // После tel: окно получает фокус обратно, и браузер рисует рамку; при нажатии мышью или пальцем фокус снимаем
  if (e.detail > 0) { const f = e.target.closest('a,button,summary'); if (f) f.blur(); }
});

// --- Старт ---------------------------------------------------------------------------------
const saved = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
const asked = new URLSearchParams(location.search).get('lang');
const ru = /^(ru|uk|be)/i.test((navigator.languages || [navigator.language])[0]);
setLang(asked === 'en' || asked === 'ru' ? asked : saved || (ru ? 'ru' : 'en'));
if (document.fonts) document.fonts.ready.then(place);
// Тяжёлый свет грузится после первого экрана
addEventListener('load', () => setTimeout(() => { lit.src = 'img/maket-svet.webp'; }, 300));
