# Ixonity — сайт студії

Статичний сайт (HTML + CSS + JS) з невеликою Cloudflare Pages Function для визначення країни.
Production-репозиторій: `https://github.com/energymotort-collab/ixonity-site`.

## Файли
| файл | що це |
|---|---|
| `index.html` | preview / мовний fallback головної сторінки |
| `ua/`, `en/` | окремі індексовані мовні версії та сторінки кейсів |
| `styles.css` | дизайн-система і всі стилі |
| `app.js` | анімації, калькулятор, перемикач мов, форма |
| `case.css`, `case.js` | спільний дизайн і lazy-video для кейсів |
| `scripts/build-site.mjs` | генерація `/ua`, `/en` і шести локалізованих кейсів |
| `functions/` | Cloudflare Pages Functions: країна → український або міжнародний прайс |
| `privacy.html` / `terms.html` / `impressum.html` | юридичні сторінки |
| `robots.txt` / `sitemap.xml` | базова індексація пошуковими системами |
| `assets/`, `media/` | зображення й відео |

## Що редагувати найчастіше

**Контакти й курс долара** — початок `app.js`, об'єкт `CFG`:
```js
const CFG = { email:'ixonity@gmail.com', phone:'+380771817071', usdToUah: 44.47 };
```

**Ціни** — в `index.html` є окремі панелі `data-market-panel="ua"` і `data-market-panel="global"`.
Користувач не бачить перемикача: Cloudflare визначає лише код країни. Калькулятор використовує
`data-base-ua` і `data-base-global`; формула розташована в `app.js`.

**Тексти** — українська лежить прямо в HTML. Англійська — в об'єкті `EN` у `app.js`,
ключі збігаються з атрибутами `data-i18n`. Змінили українську фразу — змініть і англійський ключ.

**Статус доступності** — `index.html`, елемент `.hero__tag`, та ключ `badge` в англійському
словнику `EN` у `app.js`.

## Збірка мовних сторінок

Після змін у `index.html`, `app.js` або даних кейсів виконайте:
```bash
node scripts/build-site.mjs
```

## Форма заявок

Форма надсилає JSON через FormSubmit на `ixonity@gmail.com`. Перше реальне відправлення створить лист активації — власник цієї пошти має підтвердити адресу. Не змінюйте одержувача на email GitHub-акаунта, якщо він не повинен отримувати заявки.

## Рекомендована публікація

GitHub зберігає код, Cloudflare Pages публікує сайт і виконує географічну логіку на edge.

1. Підключіть у Cloudflare Pages GitHub-репозиторій `energymotort-collab/ixonity-site`.
2. Production branch: `main`.
3. Build command: `node scripts/build-site.mjs`.
4. Build output directory: `.`.
5. Після deployment підключіть свій домен у Cloudflare Pages.

GitHub Pages також може віддати HTML/CSS/JS, але не виконає `functions/`, тому точне автоматичне
розділення цін за країною там працювати не буде. Firebase Hosting для цього сайту технічно можливий,
але потребує Functions/Cloud Run і буде складнішим без практичної переваги.

## Свій домен
1. Купіть домен (наприклад `ixonity.com.ua`).
2. Додайте домен у Cloudflare Pages — потрібні DNS-записи будуть створені або показані автоматично.
3. Перевірте HTTPS та редирект кореня: Україна → `/ua/`, інші країни → `/en/`.

Для production sitemap запустіть збірку з абсолютною адресою без кінцевого `/`:
```bash
SITE_BASE="https://example.com" node scripts/build-site.mjs
```
Потім додайте згенеровану абсолютну адресу `sitemap.xml` у `robots.txt`.
