const CONTACT_EMAIL = 'ixonity@gmail.com'; // change if needed
const PHONE_WHATSAPP = '380771817071'; // international format for wa.me

// i18n dictionary
const dict = {
  en: {
    nav_about: "About",
    nav_services: "Services",
    nav_portfolio: "Portfolio",
    nav_contact: "Contact",
    hero_title: "Digital Evolution",
    hero_sub: "Ukrainian indie studio by FOP Zaitsev Oleksii (Odesa). We craft performant iOS apps with beautiful design.",
    hero_cta: "Get in touch",
    hero_secondary: "See what we do",
    about_title: "Who we are",
    about_p1: "Ixonity is a Ukrainian, tech‑forward indie studio from Odesa led by <strong>FOP Zaitsev Oleksii</strong>. We design and ship Apple‑platform products end‑to‑end: expressive SwiftUI apps, privacy‑first Firebase/Cloud Functions backends, payments and analytics integrations, and App Store distribution. We value minimal aesthetics, reliability, and measurable results. Alongside client work we build our own products (QR-Ixonity) and prototype mobile games.",
    about_b1: "<strong>Focus:</strong> iOS apps (SwiftUI) + Firebase backends.",
    about_b2: "QR tools, analytics, short links, dynamic designs.",
    about_b3: "Future: mobile games & creative tools.",
    legal_title: "Legal & Contacts",
    legal_fop: "FOP:",
    legal_addr_label: "Address:",
    legal_phone: "Phone / WhatsApp:",
    srv_title: "What we do",
    srv1_title: "iOS Apps",
    srv1_desc: "SwiftUI apps with smooth animations, offline-first, and clean architecture.",
    srv2_title: "Backends",
    srv2_desc: "Firebase / Cloud Functions, auth, payments, analytics dashboards.",
    srv3_title: "QR & Analytics",
    srv3_desc: "Static & dynamic QR codes, branded frames, click stats, API.",
    srv4_title: "Design",
    srv4_desc: "“Liquid Glass” UI, logos, landing pages, marketing visuals.",
    srv5_title: "Games (Soon)",
    srv5_desc: "Prototyping stylish, lightweight mobile games with great feel.",
    port_title: "Featured",
    port_qr: "Advanced QR generator with custom eyes, frames, analytics and exports.",
    port_archdep: "E‑commerce app with SwiftUI, custom cart, Monobank acquiring.",
    contact_title: "Support & Contacts",
    form_name: "Your Name",
    form_email: "Your Email",
    form_msg: "Message",
    form_send: "Send",
    form_hint: "No backend needed: opens your email app with a pre‑filled message.",
    social_title: "Other channels",
    copy_btn: "Copy email",
    footer_fop: "FOP Zaitsev Oleksii",
    footer_support: "Support"
  },
  uk: {
    nav_about: "Про нас",
    nav_services: "Послуги",
    nav_portfolio: "Портфоліо",
    nav_contact: "Контакти",
    hero_title: "Цифрова Еволюція",
    hero_sub: "Indie‑студія ФОП Зайцев Олексій. Створюємо iOS‑додатки з красивим дизайном.",
    hero_cta: "Зв’язатися",
    hero_secondary: "Що ми робимо",
    about_title: "Хто ми",
    about_p1: "Ixonity — українська indie‑студія з Одеси (ФОП <strong>Зайцев Олексій</strong>). Проєктуємо й розробляємо продукти для екосистеми Apple повного циклу: SwiftUI‑додатки з виразною анімацією, бекенд на Firebase/Cloud Functions із фокусом на приватність, інтеграції платежів та аналітики, публікація в App Store. Ми працюємо у мінімалістичній естетиці, робимо акцент на надійність та вимірювані результати. Паралельно розвиваємо власні продукти (QR-Ixonity) і готуємо прототипи ігор.",
    about_b1: "<strong>Фокус:</strong> iOS‑додатки (SwiftUI) + Firebase‑бекенд.",
    about_b2: "QR‑інструменти, аналітика, короткі посилання, динамічні дизайни.",
    about_b3: "Плани: мобільні ігри та креативні інструменти.",
    legal_title: "Юридична інформація",
    legal_fop: "ФОП:",
    legal_addr_label: "Адреса:",
    legal_phone: "Телефон / WhatsApp:",
    srv_title: "Що ми робимо",
    srv1_title: "iOS‑додатки",
    srv1_desc: "Додатки на SwiftUI з плавними анімаціями, офлайн‑режимом і чистою архітектурою.",
    srv2_title: "Бекенд",
    srv2_desc: "Firebase / Cloud Functions, автентифікація, платежі, аналітика.",
    srv3_title: "QR та Аналітика",
    srv3_desc: "Статичні й динамічні QR‑коди, бренд‑фрейми, статистика кліків, API.",
    srv4_title: "Дизайн",
    srv4_desc: "UI у стилі «Liquid Glass», логотипи, лендинги, маркетингові візуали.",
    srv5_title: "Ігри (скоро)",
    srv5_desc: "Прототипи стильних легких мобільних ігор з відмінним відчуттям.",
    port_title: "Приклади",
    port_qr: "Просунутий генератор QR з кастомними «очима», фреймами, аналітикою та експортом.",
    port_archdep: "E‑commerce застосунок на SwiftUI, кастомний кошик, еквайринг Monobank.",
    contact_title: "Підтримка та контакти",
    form_name: "Ваше ім’я",
    form_email: "Ваш Email",
    form_msg: "Повідомлення",
    form_send: "Надіслати",
    form_hint: "Без бекенду: відкриється ваш поштовий клієнт із заповненим листом.",
    social_title: "Інші канали",
    copy_btn: "Скопіювати email",
    footer_fop: "ФОП Зайцев Олексій",
    footer_support: "Підтримка"
  }
};

function applyI18n(lang){
  const strings = dict[lang] || dict['en'];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(strings[key]) el.innerHTML = strings[key];
  });
  document.documentElement.lang = (lang === 'uk') ? 'uk' : 'en';
  localStorage.setItem('ix_lang', lang);
  // toggle buttons
  document.querySelectorAll('.lang').forEach(b=>b.classList.remove('active'));
  document.getElementById(lang==='uk' ? 'btn-uk' : 'btn-en').classList.add('active');
}

function initLang(){
  const saved = localStorage.getItem('ix_lang');
  const lang = saved || 'en';
  applyI18n(lang);
  document.getElementById('btn-uk').addEventListener('click', ()=>applyI18n('uk'));
  document.getElementById('btn-en').addEventListener('click', ()=>applyI18n('en'));
}

function initForm(){
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = encodeURIComponent('Support inquiry from ' + data.name);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
  document.getElementById('copyEmail').addEventListener('click',()=>{
    navigator.clipboard.writeText(CONTACT_EMAIL).then(()=>{
      const btn = document.getElementById('copyEmail');
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(()=>btn.textContent = prev, 1200);
    });
  });
  // Update quick links in case email/wa constants are changed above
  const mailBtn = document.getElementById('mailBtn');
  mailBtn.href = `mailto:${CONTACT_EMAIL}`;
  mailBtn.textContent = `Email: ${CONTACT_EMAIL}`;
  document.getElementById('waBtn').href = `https://wa.me/${PHONE_WHATSAPP}`;
}

function initPreloader(){
  const pre = document.getElementById('preloader');
  window.addEventListener('load', ()=>{
    setTimeout(()=>pre.classList.add('hide'), 500);
  });
}

function initYear(){
  document.getElementById('year').textContent = new Date().getFullYear();
}

initPreloader();
initLang();
initForm();
initYear();

try{document.getElementById('igBtn').href='https://instagram.com/ixonity_studio';}catch(e){}
