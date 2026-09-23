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
| `assets/`, `media/` | зображення й відео; `assets/og/` — окремі social-preview картки 1200×630 |
| `404.html` | справжня сторінка 404 для Cloudflare Pages, що вимикає SPA fallback |

## Що редагувати найчастіше

**Контакти й курс долара** — початок `app.js`, об'єкт `CFG`:
```js
const CFG = { email:'hello@ixonity.dev', phone:'+380771817071', usdToUah: 44.47 };
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

Форма надсилає JSON через FormSubmit на `hello@ixonity.dev`. Перше реальне відправлення створить лист активації — власник цієї пошти має підтвердити адресу. Не змінюйте одержувача на email GitHub-акаунта, якщо він не повинен отримувати заявки.

## Публікація на Cloudflare Pages

Домен `ixonity.dev` зареєстровано в Cloudflare, тому сайт живе там же: DNS
підключається одним кліком, а `functions/` виконуються на edge.

Налаштування проєкту Pages для цього репозиторію:

| поле | значення |
|---|---|
| Repository | `energymotort-collab/ixonity-site` |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `ixonity-site-legal` |
| Build command | `node scripts/build-site.mjs` |
| Build output directory | `.` |
| Environment variable | `SITE_BASE = https://ixonity.dev` |

Для production `SITE_BASE` має дорівнювати `https://ixonity.dev`. Генератор також має
цей домен як безпечне значення за замовчуванням, щоб canonical, sitemap та social preview
ніколи не стали відносними через пропущену змінну середовища.

Що дає Cloudflare, чого не дає GitHub Pages:

- `functions/api/market.js` віддає країну відвідувача, тому українці бачать
  гривню, решта світу — євро. На GitHub Pages ця функція не виконується.
- `functions/index.js` перекидає корінь на `/ua/` або `/en/` за країною.
- сайт лежить у корені домену, а не в підпапці.

Після першого деплою: **Custom domains → Set up a domain** для `ixonity.dev`
і `www.ixonity.dev`. Записи створяться автоматично, бо домен у тому ж акаунті.
`.dev` входить у список HSTS preload, тож HTTPS вмикається примусово — це норма.

`functions/_middleware.js` робить постійний редирект `www.ixonity.dev` → `ixonity.dev`
зі збереженням шляху та query. У Cloudflare Dashboard бажано продублювати це правилом
**Redirect Rules → Single Redirect** на рівні зони: host `www.ixonity.dev`, 301 на apex,
preserve path і query.

Публічні URL завжди без `.html`: `/ua/cases/archdep`, `/privacy` тощо. Фізичні файли
залишаються `.html`, а Cloudflare Pages обслуговує clean URL і перенаправляє старі адреси.

Перевірка, що edge-логіка жива: `https://ixonity.dev/api/market` має віддати
`{"market":"ua"}` або `{"market":"global"}`.

GitHub Pages після цього краще вимкнути (**Settings → Pages → Source: None**),
щоб пошук не бачив дві копії сайту.

## Свій домен
1. Купіть домен (наприклад `ixonity.com.ua`).
2. Додайте домен у Cloudflare Pages — потрібні DNS-записи будуть створені або показані автоматично.
3. Перевірте HTTPS та редирект кореня: Україна → `/ua/`, інші країни → `/en/`.

Для production sitemap запустіть збірку з абсолютною адресою без кінцевого `/`:
```bash
SITE_BASE="https://example.com" node scripts/build-site.mjs
```
Потім додайте згенеровану абсолютну адресу `sitemap.xml` у `robots.txt`.
