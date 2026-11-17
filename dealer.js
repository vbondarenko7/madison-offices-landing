const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const body = document.body, plan = $('#building'), planStage = $('#plan-stage'), rig = $('#rig'), glow = $('#glow'), sheet = $('#sheet'), root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;

// --- Цели счётчиков, одинаковые во всех трёх: звонок, WhatsApp, заявка. Сами счётчики подключает сборка (site/counters.html).
// Личных данных не передаём: только название цели и вариант первого экрана (hero_variant, A/B-тест). Поля заявки закрыты от записи Вебвизора
const GOALS = { call: ['Contact', 'call'], whatsapp: ['Contact', 'whatsapp'], lead: ['Lead', 'generate_lead'] };   // Метрика: Meta, GA4
const goal = (name, method = name) => {   // method — чем связались: whatsapp, sms, call
  const [meta, ga] = GOALS[name];
  if (window.ym) ym(+'114074741', 'reachGoal', name, { hero_variant: hero });
  if (window.fbq) fbq('track', meta, { content_name: name, hero_variant: hero });
  if (window.gtag) gtag('event', ga, { method, hero_variant: hero });
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="tel:"], a[href*="wa.me/"]');
  if (a && !a.closest('#lead')) goal(a.href.startsWith('tel:') ? 'call' : 'whatsapp');
});
$$('#lead input').forEach((i) => i.classList.add('ym-disable-keys'));
// --- Страница /dealer (site/dealer.html): язык и меню языков. Счётчики, цвет по прокрутке и заявка общие с главной
// (base, track, tone, lead — список DEALER_CODE в tools/build.py). Главная делает то же в lang.js и start.js, но там ещё план и комнаты ---
const waLink = (text) => `https://wa.me/19169144407?text=${encodeURIComponent(text)}`;
const DEALER = {
  ru: { title: 'Офис под лицензию автодилера в Сакраменто, $1,000 в месяц | 8500 Fruitridge Rd', description: 'Офис под лицензию дилера подержанных машин на 8500 Fruitridge Rd, Сакраменто: $1,000 в месяц, два парковочных места, место одобрено DMV. В том же здании мастерская 2,500 кв. футов с офисом за $5,000.' },
  en: { title: 'Car Dealer License Office for Rent in Sacramento, $1,000/mo | 8500 Fruitridge Rd', description: 'Office for a used car dealer license at 8500 Fruitridge Rd, Sacramento: $1,000 a month with two parking spaces, DMV-approved location. A 2,500 sq ft repair shop with an office in the same building for $5,000.' },
  es: { title: 'Oficina para licencia de concesionario en Sacramento, $1,000 al mes | 8500 Fruitridge Rd', description: 'Oficina para licencia de concesionario de autos usados en 8500 Fruitridge Rd, Sacramento: $1,000 al mes con dos espacios de estacionamiento, ubicación aprobada por el DMV. En el mismo edificio, un taller de 2,500 pies² con oficina por $5,000.' },
};
$$('[data-en]').forEach((e) => { e.dataset.ru ??= e.innerHTML; });
$$('[data-en-label]').forEach((e) => { e.dataset.ruLabel = e.getAttribute('aria-label'); });
$$('[data-en-alt]').forEach((e) => { e.dataset.ruAlt = e.alt; });

function setLang(l) {
  root.lang = l;
  $$('[data-en]').forEach((e) => { e.innerHTML = e.dataset[l]; });
  $$('[data-en-label]').forEach((e) => e.setAttribute('aria-label', e.dataset[`${l}Label`]));
  $$('[data-en-alt]').forEach((e) => { e.alt = e.dataset[`${l}Alt`]; });
  $('#lang').textContent = l.toUpperCase();
  $$('[data-lang]').forEach((a) => a.setAttribute('aria-current', a.dataset.lang === l));
  document.title = DEALER[l].title;
  $('meta[name=description]').content = DEALER[l].description;
  $$('a[href^="privacy.html"]').forEach((a) => { a.href = l === 'ru' ? 'privacy.html' : `privacy.html#${l}`; });
  $$('.wa').forEach((a) => { a.href = waLink(a.getAttribute(`data-wa-${l}`)); });
  try { localStorage.setItem('lang', l); } catch (e) {}
}
$$('[data-lang]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); a.closest('details').open = false; setLang(a.dataset.lang); }));
document.addEventListener('click', (e) => { $$('details.menu').forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });
setLang(startLang);
// --- Цвет страницы перетекает вместе с прокруткой, как у Žít Braník: пока следующая секция поднимается от низа экрана до TONE.end его высоты,
// поле постепенно переходит в её цвет. Текст берёт её цвет на середине пути (CSS доводит его за .5 с), иначе на миг поле и текст совпали бы.
// Пары цветов у секций в site/design/settings.css (data-tone), здесь только смешивание ---
const TONE = { end: .3 };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.trim().slice(i, i + 2), 16));
const toned = $$('section[data-tone], header[data-tone]').map((s) => {
  const cs = getComputedStyle(s);
  return { s, name: s.dataset.tone, bg: hex(cs.getPropertyValue('--bg')), ink: cs.getPropertyValue('--ink').trim() };
});
function toneFrame() {
  let bg = toned[0].bg, ink = toned[0].ink, name = toned[0].name;
  for (const t of toned.slice(1)) {
    const v = Math.min(1, Math.max(0, (innerHeight - t.s.getBoundingClientRect().top) / (innerHeight * (1 - TONE.end))));
    if (!v) break;
    const k = v * v * (3 - 2 * v);
    bg = bg.map((c, i) => c + (t.bg[i] - c) * k);
    if (v >= .5) { ink = t.ink; name = t.name; }
  }
  body.style.setProperty('--bg', `rgb(${bg.map(Math.round).join(',')})`);
  body.style.setProperty('--ink', ink);
  body.dataset.tone = name;
}
let toneQueued = false;
addEventListener('scroll', () => {
  if (toneQueued) return;
  toneQueued = true;
  requestAnimationFrame(() => { toneQueued = false; toneFrame(); });
}, { passive: true });
addEventListener('resize', toneFrame);
toneFrame();
// --- Заявка на первом экране ------------------------------------------------------------------------------------
// Вариант now (V и Рома 09.11, как на Exit 168): имя и телефон не спрашиваем — в США звонок с незнакомого номера считают
// спамом, поэтому человек пишет или звонит сам. Три кнопки: WhatsApp и SMS с готовым текстом на языке сайта, звонок.
// Вариант checklist (<form data-send="brevo">): почта за чек-лист уходит в Brevo
const lead = $('#lead');
// Ловушка для ботов: человек это поле не видит и не заполняет, Brevo и сервис броней молча выбрасывают заявку с ним
lead.insertAdjacentHTML('beforeend', '<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">');

if (lead.dataset.send === 'brevo') {
  const email = lead.email, bad = $('#lead-bad-email'), leadOff = $('#lead-off'), leadSent = $('#lead-sent'), book = $('#book');
  const ok = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const sayBad = (b) => {
    email.parentElement.classList.toggle('bad', b);
    bad.hidden = !b;
    if (b) email.setAttribute('aria-invalid', 'true'); else email.removeAttribute('aria-invalid');
  };
  email.addEventListener('input', () => { email.parentElement.classList.toggle('good', ok()); if (ok()) sayBad(false); });
  // Brevo шлёт письмо подтверждения, после него кладёт почту в список «Madison — чек-лист» и шлёт письмо с чек-листом.
  // Форма своего языка — content/texts.toml, [form] brevo
  lead.addEventListener('submit', (e) => {
    e.preventDefault();
    leadOff.hidden = true;
    sayBad(!ok());
    if (!ok()) { email.focus(); return; }
    const f = new FormData();
    f.append('EMAIL', email.value.trim());
    if (lead.consent.checked) f.append('OPT_IN', '1');   // галочка «присылайте письма»; без неё придут только подтверждение и чек-лист
    f.append('LANG', root.lang);
    f.append('HERO_VARIANT', hero);
    f.append('email_address_check', lead.website.value);
    f.append('locale', root.lang);
    book.disabled = true;
    fetch(({ ru: 'https://9c25def2.sibforms.com/serve/MUIFAEbyTVt7ywNddCrs_UCoRupHbwjE6yWvZfHa7S8n8auxfFWsfacfJ20WXTSTvMqsPxrKY2Rbq7CJu6cdiD2zppluwlhlio56rT6ZcoMOq7cwE5E-d9t-KfcfVURsPKnjth5h8Ku0IuVqKqy4yF5_e7FgFp5nIDhqlpEc8FCu35TZRaDWts1jU0xcOYvFOyfj67P7SKhyWhyjDw==', en: '', es: '' })[root.lang] + '?isAjax=1', { method: 'POST', body: f })
      .then((r) => r.json()).then((r) => {
        if (!r.success) throw r;
        goal('lead');
        lead.classList.add('done');   // форма прячется, на её месте #lead-sent
        leadSent.hidden = false;
        leadSent.focus({ preventScroll: true });
        leadSent.scrollIntoView({ block: 'nearest' });
      }).catch(() => { leadOff.hidden = false; book.disabled = false; leadOff.scrollIntoView({ block: 'nearest' }); });
  });
} else {
  const SAY = {
    ru: { hi: 'Здравствуйте! Интересует офис на 5345 Madison Ave, хочу посмотреть.', when: 'Удобно посмотреть: ', copied: 'Скопировано', failed: 'Не получилось скопировать', qr: 'QR-код: WhatsApp с вашим сообщением' },
    en: { hi: "Hi! I'm interested in renting an office at 5345 Madison Ave and would like to schedule a tour.", when: 'Best time for me: ', copied: 'Copied', failed: "Couldn't copy", qr: 'QR code that opens WhatsApp with your message' },
    es: { hi: 'Hola, me interesa rentar una oficina en 5345 Madison Ave y me gustaría ir a verla.', when: 'Me queda bien: ', copied: 'Copiado', failed: 'No se pudo copiar', qr: 'Código QR que abre WhatsApp con su mensaje' },
  };
  // Экраны по видам дела (?hero=church и др.) и страница /dealer: своё готовое сообщение, хозяин сразу видит, кто пишет
  const OWN = {
    ru: { church: 'Здравствуйте! Интересует зал для церкви на 5345 Madison Ave, хочу посмотреть.', lawyer: 'Здравствуйте! Ищу офис для юридической практики на 5345 Madison Ave, хочу посмотреть.', realtor: 'Здравствуйте! Ищу офис для брокерской или страхового агентства на 5345 Madison Ave, хочу посмотреть.', salon: 'Здравствуйте! Ищу кабинет под салон красоты на 5345 Madison Ave, хочу посмотреть.', therapy: 'Здравствуйте! Ищу кабинет для приёма клиентов на 5345 Madison Ave, хочу посмотреть.', studio: 'Здравствуйте! Ищу комнату под студию на 5345 Madison Ave, хочу посмотреть.', trucking: 'Здравствуйте! Ищу офис под диспетчерскую на 5345 Madison Ave, хочу посмотреть.', dealer: 'Здравствуйте! Интересует офис под лицензию дилера на 8500 Fruitridge Rd, хочу посмотреть.' },
    en: { church: "Hi, I'm interested in the church space at 5345 Madison Ave. When could I come take a look?", lawyer: "Hi, I'm an attorney looking for office space at 5345 Madison Ave. When could I come see it?", realtor: "Hi, I'm looking for office space for my agency at 5345 Madison Ave. When could I come see it?", salon: "Hi, I'm looking for a beauty suite at 5345 Madison Ave. When could I come see it?", therapy: "Hi, I'm looking for an office for my practice at 5345 Madison Ave. When could I come see it?", studio: "Hi, I'm looking for studio space at 5345 Madison Ave. When could I come see it?", trucking: "Hi, I'm looking for a dispatch office at 5345 Madison Ave. When could I come see it?", dealer: "Hi, I'm interested in the dealer license office at 8500 Fruitridge Rd. When could I come take a look?" },
    es: { church: 'Hola, me interesa el local para iglesia en 5345 Madison Ave. ¿Cuándo podría ir a verlo?', lawyer: 'Hola, busco una oficina para mi práctica legal en 5345 Madison Ave. ¿Cuándo podría ir a verla?', realtor: 'Hola, busco una oficina para mi agencia en 5345 Madison Ave. ¿Cuándo podría ir a verla?', salon: 'Hola, busco una suite para mi negocio de belleza en 5345 Madison Ave. ¿Cuándo podría ir a verla?', therapy: 'Hola, busco un consultorio para mi práctica en 5345 Madison Ave. ¿Cuándo podría ir a verlo?', studio: 'Hola, busco un espacio para estudio en 5345 Madison Ave. ¿Cuándo podría ir a verlo?', trucking: 'Hola, busco una oficina de despacho en 5345 Madison Ave. ¿Cuándo podría ir a verla?', dealer: 'Hola, me interesa la oficina para licencia de concesionario en 8500 Fruitridge Rd. ¿Cuándo podría ir a verla?' },
  };
  // Готовое сообщение; «когда удобно» необязательно, пустое просто не попадает в текст
  const message = () => {
    const s = SAY[root.lang], when = lead.when.value.trim(), hi = OWN[root.lang][hero] || s.hi;
    return when ? `${hi}\n${s.when}${when}` : hi;
  };
  const wa = () => waLink(message());
  const sms = () => `sms:+19169144407?&body=${encodeURIComponent(message())}`;
  // На компьютере wa.me лишь предлагает поставить приложение, а SMS с компьютера почти не уходит (Exit 168, 09.11).
  // Поэтому там вместо перехода панель: QR-код для камеры телефона, «Скопировать заявку», WhatsApp на компьютере и номер
  const desktop = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const panel = $('#lead-desk');
  // Уведомление в Telegram через сервис броней ([form] send_to): какой кнопкой и когда удобно, без телефона клиента.
  // keepalive и text/plain (без предварительного запроса CORS): на телефоне страница уходит в фон, пока открывается WhatsApp
  // Локальная копия (http) ничего не шлёт: проба черновика не попадает в группу
  const notify = (via) => location.protocol === 'https:' && fetch('https://exit168-booking.exit168.workers.dev/madison-lead', {
    method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ via, when: lead.when.value.trim(), website: lead.website.value, hero, lang: root.lang }),
  }).catch(() => {});
  // Адрес ссылки ставится прямо в нажатии: браузер переходит по нему после обработчика, так WhatsApp открывается
  // синхронно, без блокировки всплывающих окон (грабли Exit 168, 09.11)
  $$('#lead [data-via]').forEach((a) => a.addEventListener('click', (e) => {
    const via = a.dataset.via;
    if (via === 'whatsapp') a.href = wa();
    if (via === 'sms') a.href = sms();
    goal('lead', via);
    notify(via);
    if (desktop && via !== 'call') { e.preventDefault(); showDesk(); }
  }));

  // QR-код: библиотека qrcode-generator 2.0.4 (MIT, site/qrcode.js) грузится только при первом открытии панели
  let qrLoad = null;
  const loadQr = () => qrLoad ||= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'qrcode.js';
    s.onload = ok;
    s.onerror = () => { qrLoad = null; fail(); };
    document.head.append(s);
  });
  function showDesk() {
    $('#lead-here').href = wa();
    loadQr().then(() => {
      const qr = qrcode(0, 'L');
      qr.addData(wa());
      qr.make();
      $('#lead-qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: SAY[root.lang].qr });
    }, () => {}).finally(() => {
      panel.hidden = false;
      panel.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    });
  }
  // Текст в панели меняется вместе с полем «когда удобно»
  lead.when.addEventListener('input', () => { if (!panel.hidden) showDesk(); });
  // На кнопке «Скопировать заявку» на 2,5 с вместо подписи — «Скопировано» (подпись сама меняется с языком)
  const copy = $('#lead-copy'), [copyLabel, copied] = copy.children;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message());
      copied.textContent = SAY[root.lang].copied;
    } catch {
      copied.textContent = SAY[root.lang].failed;
    }
    copyLabel.hidden = true;
    setTimeout(() => { copyLabel.hidden = false; copied.textContent = ''; }, 2500);
  });
  lead.addEventListener('submit', (e) => e.preventDefault());   // Enter в поле «когда удобно» страницу не перезагружает
}
