import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const enMatch = appJs.match(/const EN = (\{[\s\S]*?\n\});\n\nconst UA/);
if (!enMatch) throw new Error('Could not extract EN dictionary from app.js');
const EN = Function('"use strict"; return (' + enMatch[1].replace(/;$/, '') + ')')();

function translateEnglish(html) {
  return html.replace(/<([a-z][\w:-]*)([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi, function(match, tag, attrs, key) {
    return Object.prototype.hasOwnProperty.call(EN, key)
      ? '<' + tag + attrs + '>' + EN[key] + '</' + tag + '>'
      : match;
  });
}

function localePage(lang) {
  let html = lang === 'en' ? translateEnglish(rootHtml) : rootHtml;
  const title = lang === 'en'
    ? 'Ixonity — Digital Product Studio from Ukraine'
    : 'Ixonity — digital product studio з України';
  const description = lang === 'en'
    ? 'Ixonity designs and builds premium websites, e-commerce, web apps, mobile products, UI/UX and interactive WebGL experiences for clients worldwide.'
    : 'Ixonity проєктує та створює цифрові продукти: premium websites, e-commerce, web apps, iOS, Android, UI/UX і WebGL. Базуємося в Україні, працюємо по всьому світу.';
  html = html.replace('<html lang="uk">', '<html lang="' + lang + '">');
  html = html.replace('<body>', '<body data-locale-route="' + lang + '">');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + description + '">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + title + '">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + description + '">');
  html = html.replace(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="' + (lang === 'en' ? 'en_US' : 'uk_UA') + '">');
  html = html.replace('<link rel="canonical" href="./">', '<link rel="canonical" href="./">');
  html = html.replace('<link rel="alternate" hreflang="uk" href="ua/">', '<link rel="alternate" hreflang="uk" href="../ua/">');
  html = html.replace('<link rel="alternate" hreflang="en" href="en/">', '<link rel="alternate" hreflang="en" href="../en/">');
  html = html.replace('<link rel="alternate" hreflang="x-default" href="./">', '<link rel="alternate" hreflang="x-default" href="../ua/">');
  html = html.replace(/(["'])(assets|media)\//g, '$1../$2/');
  html = html.replace(/href="styles\.css/g, 'href="../styles.css');
  html = html.replace(/src="app\.js/g, 'src="../app.js');
  html = html.replace(/href="(privacy|terms|impressum)\.html/g, 'href="../$1.html');
  html = html.replace(/href="(?:ua|en)\/cases\/([^"]+)"/g, 'href="cases/$1"');
  if (lang === 'en') {
    html = html.replace('Показані ціни для клієнтів з України: гривня, компактний scope і швидший запуск.', 'International pricing is shown for clients outside Ukraine: custom scope and EUR billing.');
    html = html.replace('<button data-lang="uk" class="on">UA</button><button data-lang="en">EN</button>', '<button data-lang="uk">UA</button><button data-lang="en" class="on">EN</button>');
    html = html.replace('<div class="price" data-market-panel="ua">', '<div class="price" data-market-panel="ua" hidden>');
    html = html.replace('<div class="price" data-market-panel="global" hidden>', '<div class="price" data-market-panel="global">');
    html = html.replace(/data-usd-range="600,1100" data-market-faq-range/g, 'data-usd-range="1745,3490" data-market-faq-range');
    html = html.replace('<b data-market-support>від 15 000 ₴/міс</b>', '<b data-market-support>from €500/mo</b>');
    html = html.replace('data-usd="337" data-market-support-price', 'data-usd="581.5" data-market-support-price');
    html = html.replace('"addressLocality":"Одеса"', '"addressLocality":"Odesa"');
    html = html.replace('"areaServed":"UA"', '"areaServed":"Worldwide"');
  }
  return html;
}

const cases = {
  archdep: {
    image:'archdep-feature.png',
    tags:'SwiftUI · Firebase · Monobank',
    external:'https://apps.apple.com/app/id6748553482',
    ua:{
      title:'Archdep.Furniture', kicker:'Case 01 / Mobile commerce', role:'Product design + iOS', status:'Published on App Store', year:'2025–2026',
      deck:'Мобільний магазин українських меблів, у якому каталог, оплата та робота менеджера зібрані в один цілісний продукт.',
      problemTitle:'Не просто каталог, а робочий канал продажу',
      problem:'Завданням було перенести складний меблевий асортимент у телефон без втрати логіки вибору. Користувачеві потрібні фільтри, кошик і зрозуміле замовлення; менеджеру — контроль заявок та аналітика.',
      approachTitle:'Один продукт від UX до релізу',
      approach:'Спроєктовано мобільні сценарії, інтерфейс і технічну архітектуру. Реалізовано нативний застосунок на SwiftUI, Firebase, еквайринг Monobank, аналітику поведінки та кабінет менеджера.',
      outcomeTitle:'Реальний застосунок у проді',
      outcome:'Продукт пройшов повний шлях від першого макета до публікації в App Store. Вихідний код, операційні сценарії та доступи залишаються частиною керованої продуктової системи.',
      back:'← Усі роботи', view:'Відкрити в App Store', nextLabel:'Наступний кейс', next:'QR-Ixonity', imageLabel:'Product interface / production'
    },
    en:{
      title:'Archdep.Furniture', kicker:'Case 01 / Mobile commerce', role:'Product design + iOS', status:'Published on App Store', year:'2025–2026',
      deck:'A mobile store for Ukrainian furniture, bringing catalogue discovery, payment and manager operations into one coherent product.',
      problemTitle:'A sales channel, not merely a catalogue',
      problem:'The challenge was to move a complex furniture range onto a phone without losing the logic of selection. Customers need filters, cart and clear ordering; managers need lead control and behavioural insight.',
      approachTitle:'One product from UX to release',
      approach:'We designed the mobile journeys, interface and technical architecture. The native SwiftUI app uses Firebase, Monobank acquiring, behavioural analytics and a dedicated manager dashboard.',
      outcomeTitle:'A real product in production',
      outcome:'The product travelled from first mockup to App Store publication. Source code, operating flows and access credentials remain part of a manageable product system.',
      back:'← All work', view:'Open on the App Store', nextLabel:'Next case', next:'QR-Ixonity', imageLabel:'Product interface / production'
    },
    next:'qr-ixonity'
  },
  'qr-ixonity': {
    image:'qr-feature.png',
    tags:'Dynamic QR · Analytics · Vector',
    external:'https://apps.apple.com/app/qr-ixonity/id6752862005',
    ua:{
      title:'QR-Ixonity', kicker:'Case 02 / Utility product', role:'UX/UI + iOS', status:'Published on App Store', year:'2025–2026',
      deck:'Генератор QR-кодів, створений як повноцінний комерційний інструмент, а не одноразова утиліта.',
      problemTitle:'QR має працювати і виглядати як бренд',
      problem:'Звичайні генератори обмежують дизайн і не пояснюють, що відбувається після друку коду. Потрібно було поєднати кастомізацію, якісний експорт і керовану статистику.',
      approachTitle:'Контроль кожної деталі',
      approach:'Додано власні форми очей і рамок, брендування, динамічні посилання, статистику сканувань та векторний експорт для друку. Інтерфейс зберігає складні налаштування зрозумілими на телефоні.',
      outcomeTitle:'Store-ready інструмент',
      outcome:'Застосунок опублікований в App Store і демонструє повний цикл Ixonity: продуктова логіка, дизайн, нативна розробка, тестування та реліз.',
      back:'← Усі роботи', view:'Відкрити в App Store', nextLabel:'Наступний кейс', next:'StormDive', imageLabel:'QR design system / production'
    },
    en:{
      title:'QR-Ixonity', kicker:'Case 02 / Utility product', role:'UX/UI + iOS', status:'Published on App Store', year:'2025–2026',
      deck:'A QR-code generator designed as a complete commercial tool rather than a disposable utility.',
      problemTitle:'A QR code should work and look on-brand',
      problem:'Generic generators restrict design and provide little visibility after a code is printed. The product needed to combine customisation, production-quality export and useful scan insight.',
      approachTitle:'Control over every detail',
      approach:'We built custom eyes and frames, brand controls, dynamic destinations, scan statistics and vector export for print. The interface keeps a deep option set understandable on a phone.',
      outcomeTitle:'A store-ready tool',
      outcome:'The app is published on the App Store and demonstrates the complete Ixonity cycle: product logic, design, native engineering, testing and release.',
      back:'← All work', view:'Open on the App Store', nextLabel:'Next case', next:'StormDive', imageLabel:'QR design system / production'
    },
    next:'stormdive'
  },
  stormdive: {
    image:'hero-main.jpg',
    video:'sht.mp4',
    tags:'WebGPU · Raymarching · R&D',
    external:'https://instagram.com/ixonity_studio',
    ua:{
      title:'StormDive', kicker:'Case 03 / Graphics R&D', role:'Research + WebGPU', status:'Active R&D', year:'2026',
      deck:'Власний планетарний 3D-рушій — лабораторія графіки, фізики світла та високопродуктивної взаємодії у браузері.',
      problemTitle:'Планетарний масштаб у реальному часі',
      problem:'Об’ємні хмари, атмосфера і кліматична динаміка швидко перевантажують браузер. Мета — зберегти відчуття масштабу, глибини та руху без перетворення сцени на важке відео.',
      approachTitle:'Шейдери замість декорації',
      approach:'Рушій використовує WebGPU, raymarching, розсіювання Релея та Мі, симуляцію клімату на великій кількості часток і безшовний LOD. Дослідження напряму підсилює комерційні 3D-конфігуратори та інтерактивні брендові сцени.',
      outcomeTitle:'R&D, яке переходить у продукт',
      outcome:'StormDive залишається активною лабораторією. Ми не приписуємо йому вигадані бізнес-метрики — показуємо реальну технічну складність і те, як вона стає прикладною експертизою.',
      back:'← Усі роботи', view:'Стежити в Instagram', nextLabel:'Повернутися до', next:'Archdep.Furniture', imageLabel:'Live graphics research / lazy video'
    },
    en:{
      title:'StormDive', kicker:'Case 03 / Graphics R&D', role:'Research + WebGPU', status:'Active R&D', year:'2026',
      deck:'Our planetary 3D engine is a working laboratory for graphics, light physics and high-performance interaction in the browser.',
      problemTitle:'Planetary scale in real time',
      problem:'Volumetric clouds, atmosphere and climate dynamics can overwhelm a browser quickly. The goal is to preserve scale, depth and motion without turning the scene into a heavy prerecorded video.',
      approachTitle:'Shaders instead of decoration',
      approach:'The engine uses WebGPU, raymarching, Rayleigh and Mie scattering, a high-particle-count climate simulation and seamless LOD. This research directly strengthens commercial 3D configurators and interactive brand scenes.',
      outcomeTitle:'R&D that transfers into products',
      outcome:'StormDive remains an active laboratory. We do not assign invented business metrics to it; we show the real technical difficulty and how it becomes useful product expertise.',
      back:'← All work', view:'Follow on Instagram', nextLabel:'Return to', next:'Archdep.Furniture', imageLabel:'Live graphics research / lazy video'
    },
    next:'archdep'
  }
};

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function casePage(slug, item, lang) {
  const t = item[lang];
  const other = lang === 'ua' ? 'en' : 'ua';
  const isVideo = Boolean(item.video);
  const media = isVideo
    ? '<video muted loop playsinline preload="none" poster="../../assets/' + item.image + '" data-src="../../media/' + item.video + '"></video>'
    : '<img src="../../assets/' + item.image + '" alt="' + esc(t.title) + '" loading="eager">';
  const shot = isVideo
    ? '<video muted loop playsinline preload="none" poster="../../assets/' + item.image + '" data-src="../../media/' + item.video + '"></video>'
    : '<img src="../../assets/' + item.image + '" alt="' + esc(t.title) + '" loading="lazy">';
  const lines = [
    '<!DOCTYPE html>',
    '<html lang="' + (lang === 'ua' ? 'uk' : 'en') + '">',
    '<head>',
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<title>' + esc(t.title) + ' — Ixonity case study</title>',
    '<meta name="description" content="' + esc(t.deck) + '">',
    '<link rel="canonical" href="' + slug + '.html"><link rel="alternate" hreflang="uk" href="../../ua/cases/' + slug + '.html"><link rel="alternate" hreflang="en" href="../../en/cases/' + slug + '.html">',
    '<meta name="theme-color" content="#07070A"><meta property="og:type" content="article"><meta property="og:title" content="' + esc(t.title) + ' — Ixonity"><meta property="og:description" content="' + esc(t.deck) + '"><meta property="og:image" content="../../assets/' + item.image + '">',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&amp;family=Manrope:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="../../case.css?v=cases-v1-20260909">',
    '</head><body>',
    '<header class="case-head"><div class="case-wrap case-head__in"><a class="case-brand" href="../"><i></i>Ixonity</a><a class="case-back" href="../#work">' + t.back + '</a><nav class="case-lang" aria-label="Language"><a class="' + (lang === 'ua' ? 'on' : '') + '" href="../../ua/cases/' + slug + '.html">UA</a><a class="' + (lang === 'en' ? 'on' : '') + '" href="../../en/cases/' + slug + '.html">EN</a></nav></div></header>',
    '<main>',
    '<section class="case-hero"><div class="case-hero__media">' + media + '</div><div class="case-wrap"><div class="case-hero__body"><div class="case-kicker">' + t.kicker + '</div><h1>' + t.title + '</h1><p class="case-deck">' + t.deck + '</p></div><div class="case-meta"><div><small>Role</small><b>' + t.role + '</b></div><div><small>Status</small><b>' + t.status + '</b></div><div><small>Stack / period</small><b>' + item.tags + ' · ' + t.year + '</b></div></div></div></section>',
    '<section class="case-main"><div class="case-wrap"><div class="case-intro"><div><span class="case-num">01 / Context</span><h2>' + t.problemTitle + '</h2></div><div class="case-copy"><article><h3>01 — ' + t.problemTitle + '</h3><p>' + t.problem + '</p></article><article><h3>02 — ' + t.approachTitle + '</h3><p>' + t.approach + '</p></article><article><h3>03 — ' + t.outcomeTitle + '</h3><p>' + t.outcome + '</p></article></div></div>',
    '<div class="case-shot">' + shot + '<span class="case-shot__label">' + t.imageLabel + '</span></div></div></section>',
    '<section class="case-wrap case-next"><a href="' + item.next + '.html"><small>' + t.nextLabel + '</small><strong>' + t.next + ' →</strong></a><a class="case-cta" href="' + item.external + '" target="_blank" rel="noopener">' + t.view + ' ↗</a></section>',
    '</main><footer class="case-wrap case-next"><span>© <span data-year></span> Ixonity</span><a href="../#contact">ixonity@gmail.com</a></footer>',
    '<script src="../../case.js?v=cases-v1-20260909"></script>',
    '</body></html>'
  ];
  return lines.join('\n');
}

for (const lang of ['ua', 'en']) {
  const localeDir = path.join(rootDir, lang);
  const caseDir = path.join(localeDir, 'cases');
  fs.mkdirSync(caseDir, { recursive:true });
  fs.writeFileSync(path.join(localeDir, 'index.html'), localePage(lang === 'ua' ? 'uk' : 'en'));
  for (const [slug, item] of Object.entries(cases)) {
    fs.writeFileSync(path.join(caseDir, slug + '.html'), casePage(slug, item, lang));
  }
}

const siteBase = String(process.env.SITE_BASE || '').replace(/\/$/, '');
if (siteBase) {
  const urls = [
    '/ua/', '/en/', '/privacy.html', '/terms.html', '/impressum.html',
    '/ua/cases/archdep.html', '/ua/cases/qr-ixonity.html', '/ua/cases/stormdive.html',
    '/en/cases/archdep.html', '/en/cases/qr-ixonity.html', '/en/cases/stormdive.html'
  ];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(function(url) { return '  <url><loc>' + siteBase + url + '</loc><lastmod>2026-09-09</lastmod></url>'; }).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), xml);
}

console.log('Built /ua, /en and 6 localized case pages.');
