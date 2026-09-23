import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteBase = String(process.env.SITE_BASE || 'https://ixonity.dev').replace(/\/$/, '');
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

const usdToUah = Number((appJs.match(/usdToUah:\s*([\d.]+)/) || [])[1] || 44.47);
const usdToEur = Number((appJs.match(/usdToEur:\s*([\d.]+)/) || [])[1] || 0.86);

/* Текст відповіді у розмітці має збігатися з тим, що бачить людина,
   тож ціновий діапазон рахуємо так само, як його малює сторінка. */
function priceRange(attr, lang) {
  const [a, b] = attr.split(',').map(Number);
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (lang === 'en') {
    const r = n => Math.round(n * usdToEur / 10) * 10;
    return '€' + grp(r(a)) + ' – €' + grp(r(b));
  }
  const r = n => Math.round(n * usdToUah / 500) * 500;
  return grp(r(a)) + ' ₴ – ' + grp(r(b)) + ' ₴';
}

function singlePrice(attr, lang) {
  const usd = Number(attr);
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (lang === 'en') return '€' + grp(Math.round(usd * usdToEur / 10) * 10);
  return grp(Math.round(usd * usdToUah / 500) * 500) + ' ₴';
}

function plainText(html, lang) {
  return html
    .replace(/<span data-usd-range="([^"]+)"[^>]*><\/span>/g, (_, a) => priceRange(a, lang))
    .replace(/<span data-usd="([^"]+)"[^>]*><\/span>/g, (_, a) => singlePrice(a, lang))
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

function faqSchema(html, lang) {
  const re = /<span data-i18n="f(\d+)q">([\s\S]*?)<\/span>[\s\S]*?<p data-i18n="f\1a">([\s\S]*?)<\/p>/g;
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    items.push({
      '@type': 'Question',
      name: plainText(m[2], lang),
      acceptedAnswer: { '@type': 'Answer', text: plainText(m[3], lang) }
    });
  }
  if (!items.length) return '';
  return '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }) +
    '</script>';
}

function studioSchema(lang, title, description, canonical) {
  const uk = lang === 'uk';
  const services = uk
    ? ['Розробка сайтів і лендингів', 'Інтернет-магазини та каталоги', 'Мобільні застосунки iOS та Android', 'Бекенд та інтеграції', 'UI/UX дизайн']
    : ['Website and landing page development', 'E-commerce platforms and catalogues', 'iOS and Android app development', 'Backend development and integrations', 'UI/UX product design'];
  const graph = {
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':['ProfessionalService','Organization'], '@id':siteBase + '/#studio',
        name:'Ixonity', alternateName:'Ixonity Studio', url:siteBase + '/',
        logo:siteBase + '/assets/icon-512.png', image:siteBase + '/assets/og/ixonity-studio.jpg',
        description:uk
          ? 'Студія цифрових продуктів: UX/UI, сайти, вебсервіси, мобільні застосунки та інтерактивні рішення.'
          : 'Digital product studio for UX/UI, websites, web services, mobile apps and interactive experiences.',
        slogan:uk ? 'Цифрові продукти, що працюють' : 'Digital products built to work',
        email:'hello@ixonity.dev', telephone:'+380771817071', priceRange:'$$',
        address:{'@type':'PostalAddress', addressLocality:uk ? 'Одеса' : 'Odesa', addressCountry:'UA'},
        areaServed:['Ukraine','European Union','Worldwide'], knowsLanguage:['uk','en'],
        founder:{'@type':'Person', name:uk ? 'Олексій Зайцев' : 'Oleksii Zaitsev'},
        sameAs:['https://instagram.com/ixonity_studio'],
        hasOfferCatalog:{'@type':'OfferCatalog', name:uk ? 'Послуги' : 'Services', itemListElement:services.map(name => ({'@type':'Offer', itemOffered:{'@type':'Service', name}}))}
      },
      {'@type':'WebSite', '@id':siteBase + '/#website', url:siteBase + '/', name:'Ixonity', inLanguage:['uk','en'], publisher:{'@id':siteBase + '/#studio'}},
      {'@type':'WebPage', '@id':canonical + '#webpage', url:canonical, name:title, description, inLanguage:lang, isPartOf:{'@id':siteBase + '/#website'}, about:{'@id':siteBase + '/#studio'}}
    ]
  };
  return '<script type="application/ld+json">' + JSON.stringify(graph) + '</script>';
}

function localePage(lang) {
  let html = lang === 'en' ? translateEnglish(rootHtml) : rootHtml;
  const route = lang === 'en' ? '/en/' : '/ua/';
  const canonical = siteBase + route;
  const title = lang === 'en'
    ? 'Web & Mobile App Development Studio — Ixonity'
    : 'Розробка сайтів і застосунків під ключ — Ixonity';
  const description = lang === 'en'
    ? 'Ixonity designs and builds websites, e-commerce platforms and mobile apps end to end—from UX/UI and backend to launch and ongoing support.'
    : 'Створюємо сайти, інтернет-магазини та мобільні застосунки під ключ: UX/UI, розробка, бекенд і запуск. Ixonity — digital product studio в Одесі.';
  const locale = lang === 'en' ? 'en_US' : 'uk_UA';
  const alternateLocale = lang === 'en' ? 'uk_UA' : 'en_US';
  html = html.replace('<html lang="uk">', '<html lang="' + lang + '">');
  html = html.replace('<body>', '<body data-locale-route="' + lang + '">');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + description + '">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + canonical + '">');
  html = html.replace(/<link rel="alternate" hreflang="uk" href="[^"]*">/, '<link rel="alternate" hreflang="uk" href="' + siteBase + '/ua/">');
  html = html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">/, '<link rel="alternate" hreflang="en" href="' + siteBase + '/en/">');
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/, '<link rel="alternate" hreflang="x-default" href="' + siteBase + '/en/">');
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + canonical + '$2');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + title + '">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + description + '">');
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, '$1' + siteBase + '/assets/og/ixonity-studio.jpg$2');
  html = html.replace(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="' + locale + '">');
  html = html.replace(/<meta property="og:locale:alternate" content="[^"]*">/, '<meta property="og:locale:alternate" content="' + alternateLocale + '">');
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + title + '">');
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + description + '">');
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, '$1' + siteBase + '/assets/og/ixonity-studio.jpg$2');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => studioSchema(lang, title, description, canonical));
  html = html.replace(/(["'])(assets|media)\//g, '$1../$2/');
  html = html.replace(/href="styles\.css/g, 'href="../styles.css');
  html = html.replace(/src="app\.js/g, 'src="../app.js');
  html = html.replace(/href="(privacy|terms|impressum)(?:\.html)?/g, 'href="../$1');
  html = html.replace(/href="(?:ua|en)\/cases\/([^"]+)"/g, 'href="cases/$1"');
  if (lang === 'en') {
    html = html.replace('Показані ціни для клієнтів з України: гривня, компактний scope і швидший запуск.', 'International pricing is shown for clients outside Ukraine: custom scope and EUR billing.');
    html = html.replace('<button data-lang="uk" class="on">UA</button><button data-lang="en">EN</button>', '<button data-lang="uk">UA</button><button data-lang="en" class="on">EN</button>');
    html = html.replace('<div class="price" data-market-panel="ua">', '<div class="price" data-market-panel="ua" hidden>');
    html = html.replace('<div class="price" data-market-panel="global" hidden>', '<div class="price" data-market-panel="global">');
    html = html.replace(/data-usd-range="600,1100" data-market-faq-range/g, 'data-usd-range="1745,3490" data-market-faq-range');
    html = html.replace('<b data-market-support>від 8 000 ₴/міс</b>', '<b data-market-support>from €500/mo</b>');
    html = html.replace('data-usd="337" data-market-support-price', 'data-usd="581.5" data-market-support-price');
  }
  const faq = faqSchema(html, lang);
  if (faq) html = html.replace('</head>', '  ' + faq + '\n</head>');
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

const caseSeo = {
  archdep: {
    og:'archdep.jpg',
    ua:{
      title:'Archdep: мобільний магазин меблів для iOS — Ixonity',
      description:'Кейс Ixonity: UX/UI та розробка SwiftUI-застосунку Archdep.Furniture з каталогом, кошиком, оплатою Monobank, Firebase і кабінетом менеджера.'
    },
    en:{
      title:'Archdep: iOS Furniture Store Case Study — Ixonity',
      description:'How Ixonity designed and built the Archdep.Furniture iOS app with product discovery, cart, Monobank payments, Firebase and a manager dashboard.'
    }
  },
  'qr-ixonity': {
    og:'qr-ixonity.jpg',
    ua:{
      title:'QR-Ixonity: генератор QR-кодів для iOS — кейс Ixonity',
      description:'Кейс iOS-застосунку QR-Ixonity: брендовані QR-коди, динамічні посилання, статистика сканувань і векторний експорт для друку.'
    },
    en:{
      title:'QR-Ixonity: iOS QR Code Generator — Ixonity Case Study',
      description:'How Ixonity built a commercial iOS QR-code generator with custom branding, dynamic destinations, scan analytics and vector export for print.'
    }
  },
  stormdive: {
    og:'stormdive.jpg',
    ua:{
      title:'StormDive: WebGPU-планета в реальному часі — Ixonity',
      description:'R&D-кейс Ixonity: браузерний 3D-рушій на WebGPU з raymarching, атмосферним розсіюванням, об’ємними хмарами та безшовним LOD.'
    },
    en:{
      title:'StormDive: Real-Time WebGPU Planet Engine — Ixonity',
      description:'Ixonity’s WebGPU R&D case study: a real-time planetary engine with raymarching, atmospheric scattering, volumetric clouds and seamless LOD.'
    }
  }
};

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function caseStructuredData(slug, item, lang, seo, canonical, imageUrl) {
  const t = item[lang];
  const inLanguage = lang === 'ua' ? 'uk' : 'en';
  const applicationCategory = slug === 'archdep'
    ? 'ShoppingApplication'
    : (slug === 'qr-ixonity' ? 'UtilitiesApplication' : 'GraphicsApplication');
  return JSON.stringify({
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebPage', '@id':canonical + '#webpage', url:canonical,
        name:seo.title, description:seo.description, inLanguage,
        isPartOf:{'@id':siteBase + '/#website'}, about:{'@id':canonical + '#product'}
      },
      {
        '@type':'Article', '@id':canonical + '#article', headline:seo.title,
        description:seo.description, image:[imageUrl], inLanguage,
        mainEntityOfPage:{'@id':canonical + '#webpage'},
        author:{'@id':siteBase + '/#studio'}, publisher:{'@id':siteBase + '/#studio'},
        about:{'@id':canonical + '#product'}
      },
      {
        '@type':'SoftwareApplication', '@id':canonical + '#product', name:t.title,
        description:t.deck, applicationCategory,
        operatingSystem:slug === 'stormdive' ? 'Web browser' : 'iOS',
        url:item.external
      },
      {
        '@type':'BreadcrumbList', itemListElement:[
          {'@type':'ListItem', position:1, name:'Ixonity', item:siteBase + '/' + lang + '/'},
          {'@type':'ListItem', position:2, name:t.title, item:canonical}
        ]
      }
    ]
  });
}

function casePage(slug, item, lang) {
  const t = item[lang];
  const seo = caseSeo[slug][lang];
  const canonical = siteBase + '/' + lang + '/cases/' + slug;
  const imageUrl = siteBase + '/assets/og/' + caseSeo[slug].og;
  const locale = lang === 'ua' ? 'uk_UA' : 'en_US';
  const alternateLocale = lang === 'ua' ? 'en_US' : 'uk_UA';
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
    '<title>' + esc(seo.title) + '</title>',
    '<meta name="description" content="' + esc(seo.description) + '">',
    '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">',
    '<link rel="canonical" href="' + canonical + '">',
    '<link rel="alternate" hreflang="uk" href="' + siteBase + '/ua/cases/' + slug + '">',
    '<link rel="alternate" hreflang="en" href="' + siteBase + '/en/cases/' + slug + '">',
    '<link rel="alternate" hreflang="x-default" href="' + siteBase + '/en/cases/' + slug + '">',
    '<meta name="theme-color" content="#07070A">',
    '<meta property="og:type" content="article"><meta property="og:url" content="' + canonical + '">',
    '<meta property="og:title" content="' + esc(seo.title) + '"><meta property="og:description" content="' + esc(seo.description) + '">',
    '<meta property="og:image" content="' + imageUrl + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:alt" content="' + esc(t.title + ' — Ixonity case study') + '">',
    '<meta property="og:locale" content="' + locale + '"><meta property="og:locale:alternate" content="' + alternateLocale + '"><meta property="og:site_name" content="Ixonity">',
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(seo.title) + '"><meta name="twitter:description" content="' + esc(seo.description) + '"><meta name="twitter:image" content="' + imageUrl + '"><meta name="twitter:image:alt" content="' + esc(t.title + ' — Ixonity case study') + '">',
    '<link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml">',
    '<script type="application/ld+json">' + caseStructuredData(slug, item, lang, seo, canonical, imageUrl) + '</script>',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&amp;family=Manrope:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="../../case.css?v=cases-v1-20260909">',
    '</head><body>',
    '<header class="case-head"><div class="case-wrap case-head__in"><a class="case-brand" href="../../' + lang + '/"><i></i>Ixonity</a><a class="case-back" href="../../' + lang + '/#work">' + t.back + '</a><nav class="case-lang" aria-label="Language"><a class="' + (lang === 'ua' ? 'on' : '') + '" href="../../ua/cases/' + slug + '">UA</a><a class="' + (lang === 'en' ? 'on' : '') + '" href="../../en/cases/' + slug + '">EN</a></nav></div></header>',
    '<main>',
    '<section class="case-hero"><div class="case-hero__media">' + media + '</div><div class="case-wrap"><div class="case-hero__body"><div class="case-kicker">' + t.kicker + '</div><h1>' + t.title + '</h1><p class="case-deck">' + t.deck + '</p></div><div class="case-meta"><div><small>Role</small><b>' + t.role + '</b></div><div><small>Status</small><b>' + t.status + '</b></div><div><small>Stack / period</small><b>' + item.tags + ' · ' + t.year + '</b></div></div></div></section>',
    '<section class="case-main"><div class="case-wrap"><div class="case-intro"><div><span class="case-num">01 / Context</span><h2>' + t.problemTitle + '</h2></div><div class="case-copy"><article><h3>01 — ' + t.problemTitle + '</h3><p>' + t.problem + '</p></article><article><h3>02 — ' + t.approachTitle + '</h3><p>' + t.approach + '</p></article><article><h3>03 — ' + t.outcomeTitle + '</h3><p>' + t.outcome + '</p></article></div></div>',
    '<div class="case-shot">' + shot + '<span class="case-shot__label">' + t.imageLabel + '</span></div></div></section>',
    '<section class="case-wrap case-next"><a href="' + item.next + '"><small>' + t.nextLabel + '</small><strong>' + t.next + ' →</strong></a><a class="case-cta" href="' + item.external + '" target="_blank" rel="noopener">' + t.view + ' ↗</a></section>',
    '</main><footer class="case-wrap case-next"><span>© <span data-year></span> Ixonity</span><a href="../../' + lang + '/#contact">hello@ixonity.dev</a></footer>',
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

if (siteBase) {
  const today = new Date().toISOString().slice(0, 10);

  /* Карта сайту з мовними альтернативами: пошуковик одразу бачить,
     що це одна сторінка двома мовами, а не два різні документи. */
  const pairs = [
    ['/ua/', '/en/'],
    ['/ua/cases/archdep', '/en/cases/archdep'],
    ['/ua/cases/qr-ixonity', '/en/cases/qr-ixonity'],
    ['/ua/cases/stormdive', '/en/cases/stormdive']
  ];

  const alts = (uk, en) =>
    '    <xhtml:link rel="alternate" hreflang="uk" href="' + siteBase + uk + '"/>\n' +
    '    <xhtml:link rel="alternate" hreflang="en" href="' + siteBase + en + '"/>\n' +
    '    <xhtml:link rel="alternate" hreflang="x-default" href="' + siteBase + en + '"/>\n';

  let body = '';
  for (const [uk, en] of pairs) {
    for (const [loc, prio] of [[uk, '1.0'], [en, '0.9']]) {
      body += '  <url>\n    <loc>' + siteBase + loc + '</loc>\n' + alts(uk, en) +
              '    <lastmod>' + today + '</lastmod>\n    <priority>' + prio + '</priority>\n  </url>\n';
    }
  }
  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + body + '</urlset>\n');

  /* robots: пошуковики й помічники на базі ШІ пускаємо явно.
     Google-Extended і Applebot-Extended це саме токени згоди на навчання. */
  const aiBots = ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User',
                  'Claude-SearchBot','PerplexityBot','Perplexity-User','Google-Extended',
                  'Applebot-Extended','Bingbot','CCBot','meta-externalagent','Amazonbot',
                  'DuckAssistBot','YouBot','cohere-ai'];
  fs.writeFileSync(path.join(rootDir, 'robots.txt'),
    'User-agent: *\nAllow: /\n\n' +
    '# Пошукові та ШІ-агенти пускаємо свідомо\n' +
    aiBots.map(b => 'User-agent: ' + b + '\nAllow: /').join('\n\n') + '\n\n' +
    'Sitemap: ' + siteBase + '/sitemap.xml\n');

  /* llms.txt — коротка вижимка сайту для мовних моделей:
     вони читають її замість того, щоб вгадувати зміст зі верстки. */
  fs.writeFileSync(path.join(rootDir, 'llms.txt'),
`# Ixonity

> Студія повного циклу з Одеси, Україна. Проєктуємо і розробляємо сайти,
> інтернет-магазини, застосунки для iOS та Android і бекенд під них.
> Одна команда від першого екрана до запуску.

Мови сайту: українська (/ua/) та англійська (/en/).
Ціни для клієнтів з України у гривні, для решти світу в євро — сторінка
визначає це автоматично за країною відвідувача.

## Що робимо

- Сайти й лендинги: дизайн, код, аналітика, базове SEO
- Інтернет-магазини та каталоги: фільтри, кошик, оплата, доставка
- Застосунки iOS та Android: від макета до публікації в сторах
- Бекенд та інтеграції: CRM, склад, платіжні системи, Telegram
- UI/UX дизайн і прототипування

## Як працюємо

1. Бриф у листуванні, близько 30 хвилин, без дзвінків
2. Прототип до того, як клієнт платить за дизайн
3. Дизайн і код, показуємо щотижня
4. Запуск, домен, аналітика, місяць підтримки

Договір, фіксовані етапи оплати, акт виконаних робіт.
ФОП, 3 група єдиного податку, не платник ПДВ.

## Орієнтовні ціни

- Лендинг: від 18 000 ₴
- Сайт або інтернет-магазин: від 40 000 ₴
- Мобільний застосунок: від 150 000 ₴

Точна сума після брифу. Міжнародним клієнтам розрахунок у євро.

## Сторінки

- [Головна, українською](${siteBase}/ua/)
- [Головна, англійською](${siteBase}/en/)
- [Кейс: мобільний магазин меблів](${siteBase}/ua/cases/archdep)
- [Кейс: QR-продукт](${siteBase}/ua/cases/qr-ixonity)
- [Кейс: інтерактивний продукт](${siteBase}/ua/cases/stormdive)
- [Політика конфіденційності](${siteBase}/privacy)
- [Умови](${siteBase}/terms)
- [Реквізити](${siteBase}/impressum)

## Контакти

- Пошта: hello@ixonity.dev
- Телефон і WhatsApp: +380 77 181 70 71
- Instagram: https://instagram.com/ixonity_studio
- Локація: Одеса, Україна. Працюємо з клієнтами з України, ЄС, Великої Британії та США.
`);
}

console.log('Built /ua, /en and 6 localized case pages.');
