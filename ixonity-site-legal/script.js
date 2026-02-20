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
    hero_sub: "Indie studio Ixonity. We craft performant iOS apps with beautiful design.",
    hero_cta: "Get in touch",
    hero_secondary: "See what we do",
    about_title: "Who we are",
    about_p1: "Ixonity is a Ukrainian, tech‑forward indie studio from Odesa. We design and ship Apple‑platform products end‑to‑end: expressive SwiftUI apps, privacy‑first Firebase/Cloud Functions backends, payments and analytics integrations, and App Store distribution. We value minimal aesthetics, reliability, and measurable results. We also develop modern, high-performance web applications. Alongside client work we build our own products (QR-Ixonity) and prototype mobile games.",
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
    srv5_desc: "Prototyping stylish, lightweight mobile games with great feel.",
    rnd_title: "Project: StormDive",
    rnd_subtitle: "Next-Gen WebGPU Planet Engine",
    rnd_desc: "We are building a massive 3D planetary engine from scratch. Features include true volumetric raymarched clouds with Rayleigh/Mie scattering, real-time climate simulation (1M+ particles advection for wind), and interactive atmospheric flight with seamless LOD scaling.",
    rnd_tag_1: "WebGPU",
    rnd_tag_2: "Raymarching",
    rnd_tag_3: "1M+ Particles Advection",
    rnd_tag_4: "Atmospheric Scattering",
    rnd_tag_5: "Volumetric Clouds",
    rnd_tag_6: "TypeScript",
    rnd_btn: "Follow Development",
    port_title: "Our Works",
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
    hero_sub: "Indie‑студія Ixonity. Створюємо iOS‑додатки з красивим дизайном.",
    hero_cta: "Зв’язатися",
    hero_secondary: "Що ми робимо",
    about_title: "Хто ми",
    about_p1: "Ixonity — українська indie‑студія з Одеси. Проєктуємо й розробляємо продукти для екосистеми Apple повного циклу: SwiftUI‑додатки з виразною анімацією, бекенд на Firebase/Cloud Functions із фокусом на приватність, інтеграції платежів та аналітики, публікація в App Store. Ми працюємо у мінімалістичній естетиці, робимо акцент на надійність та вимірювані результати. Також ми розробляємо сучасні, високопродуктивні веб-додатки. Паралельно розвиваємо власні продукти (QR-Ixonity) і готуємо прототипи ігор.",
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
    srv5_desc: "Прототипи стильних легких мобільних ігор з відмінним відчуттям.",
    rnd_title: "Project: StormDive",
    rnd_subtitle: "Next-Gen WebGPU Planet Engine",
    rnd_desc: "Ми створюємо масивний 3D-планетарний рушій з нуля. Серед фіч: справжні волюметричні хмари (raymarching) з релеївським розсіюванням, симуляція клімату в реальному часі (адвекція 1М+ частинок вітру) та інтерактивні атмосферні польоти з безшовною деталізацією (LOD).",
    rnd_tag_1: "WebGPU",
    rnd_tag_2: "Raymarching",
    rnd_tag_3: "1M+ Частинок",
    rnd_tag_4: "Атмосферне розсіювання",
    rnd_tag_5: "Волюметричні хмари",
    rnd_tag_6: "TypeScript",
    rnd_btn: "Стежити за розробкою",
    port_title: "Наші роботи",
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

function applyI18n(lang) {
  const strings = dict[lang] || dict['en'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.innerHTML = strings[key];
  });
  document.documentElement.lang = (lang === 'uk') ? 'uk' : 'en';
  localStorage.setItem('ix_lang', lang);
  // toggle buttons
  document.querySelectorAll('.lang').forEach(b => b.classList.remove('active'));
  document.getElementById(lang === 'uk' ? 'btn-uk' : 'btn-en').classList.add('active');
}

function initLang() {
  const saved = localStorage.getItem('ix_lang');
  const lang = saved || 'en';
  applyI18n(lang);
  document.getElementById('btn-uk').addEventListener('click', () => applyI18n('uk'));
  document.getElementById('btn-en').addEventListener('click', () => applyI18n('en'));
}

function initForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = encodeURIComponent('Support inquiry from ' + data.name);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
  document.getElementById('copyEmail').addEventListener('click', () => {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
      const btn = document.getElementById('copyEmail');
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = prev, 1200);
    });
  });
  // Update quick links in case email/wa constants are changed above
  const mailBtn = document.getElementById('mailBtn');
  mailBtn.href = `mailto:${CONTACT_EMAIL}`;
  mailBtn.textContent = `Email: ${CONTACT_EMAIL}`;
  document.getElementById('waBtn').href = `https://wa.me/${PHONE_WHATSAPP}`;
}

function initPreloader() {
  const pre = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => pre.classList.add('hide'), 500);
  });
}

function initYear() {
  document.getElementById('year').textContent = new Date().getFullYear();
}

function initHoverGlow() {
  document.querySelectorAll('.glass').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: stop observing once revealed
        // observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initParallaxTilt() {
  const heroLogo = document.querySelector('.hero__logo');
  if (!heroLogo) return;
  const heroArea = document.querySelector('.hero');

  heroArea.addEventListener('mousemove', (e) => {
    const rect = heroLogo.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate tilt angles based on mouse position relative to center
    const xCenter = rect.width / 2;
    const yCenter = rect.height / 2;
    // Limit rotation to max 10 degrees
    const tiltX = ((x - xCenter) / xCenter) * 10;
    const tiltY = ((yCenter - y) / yCenter) * 10;

    heroLogo.style.setProperty('--tilt-x', `${tiltX}deg`);
    heroLogo.style.setProperty('--tilt-y', `${tiltY}deg`);
  });

  heroArea.addEventListener('mouseleave', () => {
    heroLogo.style.setProperty('--tilt-x', '0deg');
    heroLogo.style.setProperty('--tilt-y', '0deg');
    heroLogo.style.transition = 'transform 0.5s ease-out, filter 0.3s ease'; // Smooth return
    setTimeout(() => {
      heroLogo.style.transition = 'transform 0.1s ease, filter 0.3s ease'; // Back to instant for follow
    }, 500);
  });
}

function initMagneticButtons() {
  const magnetics = document.querySelectorAll('.magnetic');

  magnetics.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Move button slightly towards cursor
      btn.style.setProperty('--mag-x', `${x * 0.4}px`);
      btn.style.setProperty('--mag-y', `${y * 0.4}px`);
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--mag-x', '0px');
      btn.style.setProperty('--mag-y', '0px');
    });
  });
}

function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  if (!cursor) return;

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Add hover effect for interactive elements
  const interactives = document.querySelectorAll('a, button, .magnetic, .hero__text-logo');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
    });
  });

  // Hide custom cursor when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });
}

initPreloader();
initLang();
initForm();
initYear();
initHoverGlow();
initScrollReveal();
initParallaxTilt();
initMagneticButtons();
initCustomCursor();

try { document.getElementById('igBtn').href = 'https://instagram.com/ixonity_studio'; } catch (e) { }
