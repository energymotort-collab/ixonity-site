/* ============================================================
   IXONITY — app.js  ·  "Chrome & Acid"
   Vanilla, без залежностей. Static core + Cloudflare Pages geo.
   ============================================================ */
(() => {
'use strict';

/* --- CONFIG: правьте здесь ---------------------------------- */
const CFG = {
  email:    'ixonity@gmail.com',
  phone:    '+380771817071',
  usdToUah: 44.47,         // НБУ на 09.09.2026; оновлюйте раз на місяць
  usdToEur: 0.86,          // USD → EUR за крос-курсом НБУ на 09.09.2026
  formEndpoint: 'https://formsubmit.co/ajax/ixonity@gmail.com',
};
/* ------------------------------------------------------------ */

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches;
const lerp = (a,b,t) => a + (b-a)*t;
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const ROUTE_LANG = document.body?.dataset.localeRoute;
const savedLang = localStorage.getItem('ix_lang');
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
const localTimezone = ['Europe/Kyiv','Europe/Kiev','Europe/Uzhgorod','Europe/Zaporozhye','Europe/Simferopol'].includes(TZ);
/* ручне перемикання ринку для перевірки: ?market=ua або ?market=global, ?market=auto скидає */
const urlMarket = new URLSearchParams(location.search).get('market');
if (urlMarket === 'auto') localStorage.removeItem('ix_market');
else if (urlMarket === 'ua' || urlMarket === 'global') localStorage.setItem('ix_market', urlMarket);
const pinnedMarket = localStorage.getItem('ix_market');
const ukrainianBrowser = (navigator.languages || [navigator.language]).some(lang => /^uk\b/i.test(lang || ''));
let LANG = ROUTE_LANG || (savedLang === 'uk' || savedLang === 'en' ? savedLang : (localTimezone || ukrainianBrowser ? 'uk' : 'en'));
if (!ROUTE_LANG && location.protocol !== 'file:') {
  location.replace((localTimezone || ukrainianBrowser ? 'ua/' : 'en/') + location.hash);
  return;
}
const L = (uk, en) => LANG === 'uk' ? uk : en;
let MARKET = pinnedMarket || ((localTimezone || ukrainianBrowser) ? 'ua' : 'global');

/* --- валюты: базовая цена везде в USD, показываем в выбранной --- */
const CUR = {
  uah: { sym:'₴', rate:() => CFG.usdToUah, step:500, pre:false },
  usd: { sym:'$', rate:() => 1,            step:1,   pre:true  },
  eur: { sym:'€', rate:() => CFG.usdToEur, step:10,  pre:true  }
};
let CURRENCY = MARKET === 'ua' ? 'uah' : 'eur';
const fmtNum = n => Math.round(n).toLocaleString(LANG === 'en' ? 'en-US' : 'uk-UA').replace(/\u00A0/g, ' ');
function money(usd){
  const c = CUR[CURRENCY];
  const v = Math.round(usd * c.rate() / c.step) * c.step;
  return c.pre ? c.sym + fmtNum(v) : fmtNum(v) + ' ' + c.sym;
}
function moneyIn(usd, cur){
  const c = CUR[cur];
  const v = Math.round(usd * c.rate() / c.step) * c.step;
  return c.pre ? c.sym + fmtNum(v) : fmtNum(v) + ' ' + c.sym;
}
function renderPrices(){
  $$('[data-usd]').forEach(el => { el.textContent = money(+el.dataset.usd); });
  $$('[data-usd-range]').forEach(el => {
    const [lo, hi] = el.dataset.usdRange.split(',').map(Number);
    el.textContent = money(lo) + ' – ' + money(hi);
  });
  window.__recalc?.();
}
function setMarket(market){
  if (market !== 'ua' && market !== 'global') return;
  MARKET = market;
  CURRENCY = market === 'ua' ? 'uah' : 'eur';
  document.documentElement.dataset.market = market;
  $$('[data-market-panel]').forEach(panel => { panel.hidden = panel.dataset.marketPanel !== market; });
  $$('[data-market-faq-range]').forEach(span => { span.dataset.usdRange = market === 'ua' ? '405,787' : '1745,3490'; });
  $$('[data-market-support-price]').forEach(span => { span.dataset.usd = market === 'ua' ? '180' : '581.5'; });
  $$('[data-market-support]').forEach(el => {
    el.textContent = market === 'ua' ? L('від 8 000 ₴/міс','from ₴8,000/mo') : L('від €500/міс','from €500/mo');
  });
  const uaBudgets = ['до 30 000 ₴','30 000 – 70 000 ₴','70 000 – 150 000 ₴','150 000 – 320 000 ₴','320 000 ₴+','потрібна порада'];
  const uaBudgetsEn = ['under ₴30,000','₴30,000 – ₴70,000','₴70,000 – ₴150,000','₴150,000 – ₴320,000','₴320,000+','need advice'];
  const globalBudgets = ['до €2 000','€2 000 – €5 000','€5 000 – €10 000','€10 000 – €25 000','€25 000+','потрібна порада'];
  const globalBudgetsEn = ['under €2,000','€2,000 – €5,000','€5,000 – €10,000','€10,000 – €25,000','€25,000+','need advice'];
  const budgetLabels = market === 'ua' ? (LANG === 'uk' ? uaBudgets : uaBudgetsEn) : (LANG === 'uk' ? globalBudgets : globalBudgetsEn);
  $$('[data-budget-tier]').forEach(option => { option.textContent = budgetLabels[+option.dataset.budgetTier]; });
  const note = $('[data-market-note]');
  if (note) {
    note.textContent = market === 'ua'
      ? L('Показані ціни для клієнтів з України: гривня, компактний scope і швидший запуск.', 'Pricing for clients in Ukraine: UAH billing, a focused scope and a faster launch.')
      : L('Показані міжнародні ціни для клієнтів за межами України: custom scope та розрахунок у євро.', 'International pricing is shown for clients outside Ukraine: custom scope and EUR billing.');
  }
  renderPrices();
}
async function resolveMarket(){
  if (pinnedMarket) return;                       // вибір вручну важливіший за геовизначення
  /* GitHub Pages і локальні файли не виконують edge-функцію, тож не смикаємо її
     даремно: інакше в консолі назавжди лишається червоний 404 на api/market */
  const noEdge = location.protocol === 'file:' || /\.github\.io$/i.test(location.hostname);
  if (noEdge || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    setMarket((localTimezone || ukrainianBrowser) ? 'ua' : 'global');
    return;
  }
  try {
    const endpoint = new URL('../api/market', location.href);
    const response = await fetch(endpoint, { headers:{Accept:'application/json'}, cache:'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (data.market === 'ua' || data.market === 'global') setMarket(data.market);
  } catch(_) {}
}

/* ============ 1. PRELOADER ============ */
(() => {
  const pre = $('#pre'), f = $('#preF'), n = $('#preN');
  if (!pre) return;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    f.style.width = '100%'; n.textContent = '100';
    pre.classList.add('done');
    document.body.classList.remove('lock');
    setTimeout(() => pre.remove(), 1000);
    boot();
  };
  document.body.classList.add('lock');
  if (RM) return close();
  const D = 1300, t0 = performance.now();
  (function step(t){
    const k = clamp((t - t0) / D, 0, 1);
    const p = Math.round((1 - Math.pow(1 - k, 2.2)) * 100);
    f.style.width = p + '%'; n.textContent = p;
    if (k < 1) requestAnimationFrame(step); else setTimeout(close, 150);
  })(t0);
  setTimeout(close, 3200);
  addEventListener('pointerdown', close, { once: true });
})();

function boot(){
  requestAnimationFrame(() => $$('.hero [data-rv], .hero .split').forEach(el => el.classList.add('in')));
}

/* ============ 2. SPLIT TEXT ============ */
function splitInto(el){
  const words = el.textContent.split(/\s+/).filter(Boolean);
  el.textContent = '';
  let idx = 0;                                     // наскрізний лічильник — літери друкуються поспіль
  const STEP = 34;                                 // мс на символ
  words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'w-w';
    [...w].forEach(ch => {
      const wrap = document.createElement('span'); wrap.className = 'ch-w';
      const inner = document.createElement('span'); inner.className = 'ch-i';
      inner.textContent = ch;
      inner.style.transitionDelay = (idx++ * STEP) + 'ms';
      wrap.appendChild(inner); word.appendChild(wrap);
    });
    el.appendChild(word);
    if (wi < words.length - 1) { el.appendChild(document.createTextNode(' ')); idx++; }
  });
  el.style.setProperty('--type-ms', (idx * STEP) + 'ms');   // скільки триває набір — для курсора
}
if (!RM) $$('.split').forEach(splitInto);

/* ============ 3. REVEAL ============ */
const rio = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
$$('[data-rv], .split').forEach(el => rio.observe(el));

/* ============ 4. CURSOR + MAGNETIC ============ */
if (!TOUCH && !RM) {
  const dot = $('#cur'), ring = $('#curR');
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px)`;
  }, { passive:true });
  (function loop(){
    rx = lerp(rx, mx, .16); ry = lerp(ry, my, .16);
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
  const hot = 'a,button,input,textarea,select,label.opt,.qa__q,.tile,.work';
  document.addEventListener('pointerover', e => { if (e.target.closest(hot)) ring.classList.add('hot'); });
  document.addEventListener('pointerout',  e => { if (e.target.closest(hot)) ring.classList.remove('hot'); });

  $$('.mag').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width/2)*.22}px,${(e.clientY - r.top - r.height/2)*.32}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ============ 5. WORK — превью за курсором ============ */
if (!TOUCH && !RM) (() => {
  const peek = $('#peek'); if (!peek) return;
  let tx = innerWidth / 2, ty = innerHeight / 2, px = tx, py = ty, active = false;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive:true });

  $$('.work').forEach(w => {
    w.addEventListener('pointerenter', () => {
      const vid = w.dataset.peekV, img = w.dataset.peek;
      peek.innerHTML = '';
      if (vid) {
        const v = document.createElement('video');
        v.src = vid; v.autoplay = true; v.loop = true; v.muted = true;
        v.playsInline = true; v.poster = img || '';
        peek.appendChild(v);
      } else if (img) {
        const i = document.createElement('img'); i.src = img; i.alt = '';
        peek.appendChild(i);
      }
      px = tx; py = ty;                       // без прыжка из угла
      peek.style.left = px + 'px'; peek.style.top = py + 'px';
      peek.classList.add('on'); active = true;
    });
    w.addEventListener('pointerleave', () => { peek.classList.remove('on'); active = false; });
  });

  (function loop(){
    px = lerp(px, tx, .13); py = lerp(py, ty, .13);
    if (active) peek.style.left = px + 'px', peek.style.top = py + 'px';
    requestAnimationFrame(loop);
  })();
})();

/* ============ 6. HEADER + TONE + PROGRESS ============ */
(() => {
  const hdr = $('#hdr'), mbar = $('#mbar'), bar = $('#prog'), mm = $('#mm');
  const secs = $$('[data-tone]');
  let last = 0, tone = '';
  const upd = () => {
    const y = scrollY;
    hdr.classList.toggle('stuck', y > 40);
    hdr.classList.toggle('up', y > last && y > 460 && !mm.classList.contains('on'));
    if (mbar) mbar.classList.toggle('on', y > 700);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? y / h * 100 : 0) + '%';
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top <= 46 && r.bottom > 46) {
        if (s.dataset.tone !== tone) { tone = s.dataset.tone; document.documentElement.dataset.tone = tone; }
        break;
      }
    }
    last = y;
  };
  addEventListener('scroll', upd, { passive:true });
  addEventListener('resize', upd);
  upd();
})();

/* ============ 7. HERO — справжня рідина (симуляція Нав'є–Стокса на GPU) ============
   Швидкість і фарба живуть у плаваючих текстурах. Кожен кадр: перенесення,
   завихрення, розв'язання тиску ітераціями Якобі, віднімання градієнта.
   Це не намальовані кулі — це рідина, яка тече, змішується і реагує на курсор. */
(() => {
  const cv = $('#gl'), fall = $('#glFall'), hero = $('.hero');
  if (!cv || RM) { if (cv) cv.style.display = 'none'; return; }

  const OPT = { alpha:false, depth:false, stencil:false, antialias:false,
                preserveDrawingBuffer:false, powerPreference:'high-performance' };
  let gl = null, gl2 = false;
  try { gl = cv.getContext('webgl2', OPT); gl2 = !!gl; } catch(e){}
  if (!gl) { try { gl = cv.getContext('webgl', OPT) || cv.getContext('experimental-webgl', OPT); } catch(e){} }
  if (!gl) { cv.style.display = 'none'; return; }

  let HALF = null, LINEAR = false;
  if (gl2) {
    gl.getExtension('EXT_color_buffer_float');
    LINEAR = !!gl.getExtension('OES_texture_float_linear');
    HALF = gl.HALF_FLOAT;
  } else {
    const hf = gl.getExtension('OES_texture_half_float');
    LINEAR = !!gl.getExtension('OES_texture_half_float_linear');
    HALF = hf ? hf.HALF_FLOAT_OES : null;
  }
  if (!HALF) { cv.style.display = 'none'; return; }

  /* чи вміє відеокарта малювати в такий формат */
  const renderable = (internal, format) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, HALF, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex);
    return ok;
  };
  let F_RGBA = { i: gl2 ? gl.RGBA16F : gl.RGBA, f: gl.RGBA };
  if (!renderable(F_RGBA.i, F_RGBA.f)) { cv.style.display = 'none'; return; }
  let F_RG = gl2 && renderable(gl.RG16F, gl.RG) ? { i: gl.RG16F, f: gl.RG } : F_RGBA;
  let F_R  = gl2 && renderable(gl.R16F,  gl.RED) ? { i: gl.R16F,  f: gl.RED } : F_RGBA;
  const FILTER = LINEAR ? gl.LINEAR : gl.NEAREST;

  /* ---------- шейдери ---------- */
  const VS = [
'precision highp float;',
'attribute vec2 aPos;',
'varying vec2 vUv,vL,vR,vT,vB;',
'uniform vec2 texel;',
'void main(){',
' vUv=aPos*.5+.5;',
' vL=vUv-vec2(texel.x,0.);vR=vUv+vec2(texel.x,0.);',
' vT=vUv+vec2(0.,texel.y);vB=vUv-vec2(0.,texel.y);',
' gl_Position=vec4(aPos,0.,1.);}'].join('\n');

  const HEAD = 'precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;';

  const FS_SPLAT = [HEAD,
'uniform sampler2D uTarget;uniform float aspect;uniform vec3 color;uniform vec2 point;uniform float radius;',
'void main(){',
' vec2 p=vUv-point;p.x*=aspect;',
' vec3 s=exp(-dot(p,p)/radius)*color;',
' gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.);}'].join('\n');

  /* ручна білінійна вибірка: працює навіть там, де немає фільтрації float-текстур */
  const FS_ADVECT = [HEAD,
'uniform sampler2D uVel,uSrc;uniform vec2 texel,srcTexel;uniform float dt,diss;',
'vec4 blerp(sampler2D s,vec2 uv,vec2 ts){',
' vec2 st=uv/ts-.5;vec2 i=floor(st);vec2 f=fract(st);',
' vec4 a=texture2D(s,(i+vec2(.5,.5))*ts),b=texture2D(s,(i+vec2(1.5,.5))*ts);',
' vec4 c=texture2D(s,(i+vec2(.5,1.5))*ts),d=texture2D(s,(i+vec2(1.5,1.5))*ts);',
' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
'void main(){',
' vec2 coord=vUv-dt*blerp(uVel,vUv,texel).xy*texel;',
' gl_FragColor=blerp(uSrc,coord,srcTexel)/(1.+diss*dt);}'].join('\n');

  const FS_DIV = [HEAD,
'uniform sampler2D uVel;',
'void main(){',
' float L=texture2D(uVel,vL).x,R=texture2D(uVel,vR).x;',
' float T=texture2D(uVel,vT).y,B=texture2D(uVel,vB).y;',
' vec2 C=texture2D(uVel,vUv).xy;',
' if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;',
' gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}'].join('\n');

  const FS_CURL = [HEAD,
'uniform sampler2D uVel;',
'void main(){',
' float L=texture2D(uVel,vL).y,R=texture2D(uVel,vR).y;',
' float T=texture2D(uVel,vT).x,B=texture2D(uVel,vB).x;',
' gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}'].join('\n');

  const FS_VORT = [HEAD,
'uniform sampler2D uVel,uCurl;uniform float curl,dt;',
'void main(){',
' float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x;',
' float T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x;',
' float C=texture2D(uCurl,vUv).x;',
' vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));',
' f/=length(f)+.0001; f*=curl*C; f.y*=-1.;',
' vec2 v=texture2D(uVel,vUv).xy+f*dt;',
' gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}'].join('\n');

  const FS_PRESS = [HEAD,
'uniform sampler2D uPress,uDiv;',
'void main(){',
' float L=texture2D(uPress,vL).x,R=texture2D(uPress,vR).x;',
' float T=texture2D(uPress,vT).x,B=texture2D(uPress,vB).x;',
' float d=texture2D(uDiv,vUv).x;',
' gl_FragColor=vec4((L+R+B+T-d)*.25,0.,0.,1.);}'].join('\n');

  const FS_GRAD = [HEAD,
'uniform sampler2D uPress,uVel;',
'void main(){',
' float L=texture2D(uPress,vL).x,R=texture2D(uPress,vR).x;',
' float T=texture2D(uPress,vT).x,B=texture2D(uPress,vB).x;',
' vec2 v=texture2D(uVel,vUv).xy-vec2(R-L,T-B);',
' gl_FragColor=vec4(v,0.,1.);}'].join('\n');

  const FS_CLEAR = [HEAD,
'uniform sampler2D uTex;uniform float value;',
'void main(){gl_FragColor=value*texture2D(uTex,vUv);}'].join('\n');

  /* показ: дуже темне синє тло, фарба світиться поверх, псевдо-об\'єм по градієнту */
  const FS_SHOW = [HEAD,
'uniform sampler2D uTex;uniform vec2 texel;uniform float aspect,time;',
'vec3 night(vec2 q){',
' vec2 d=(q-.5)*vec2(aspect,1.);',
' vec3 c=vec3(.0055,.0100,.0330);',
' c+=vec3(.055,.130,.560)*.40*exp(-length(d-vec2(-.32+sin(time*.05)*.05,.26+cos(time*.043)*.04))*1.75);',
' c+=vec3(.150,.065,.450)*.34*exp(-length(d-vec2(.34+cos(time*.037)*.05,-.25+sin(time*.033)*.04))*2.10);',
' c+=vec3(.020,.160,.400)*.22*exp(-length(d-vec2(.42,.32))*2.60);',
' c*=1.-.34*smoothstep(.26,1.06,length(d));',
' return c;}',
'void main(){',
' vec3 c=texture2D(uTex,vUv).rgb;',
' float l=length(texture2D(uTex,vL).rgb),rr=length(texture2D(uTex,vR).rgb);',
' float tt=length(texture2D(uTex,vT).rgb),bb=length(texture2D(uTex,vB).rgb);',
' vec3 n=normalize(vec3(rr-l,tt-bb,length(texel)*2.2));',
' float dif=clamp(dot(n,normalize(vec3(-.35,.55,.76)))+.74,.62,1.22);',
' float spe=pow(max(dot(reflect(-normalize(vec3(-.35,.55,.76)),n),vec3(0.,0.,1.)),0.),34.);',
' c*=dif*2.10;',
/* піднімаємо насиченість, щоб фарба була соковита, а не припилена */
' float lum=dot(c,vec3(.299,.587,.114));',
' c=max(mix(vec3(lum),c,1.55),0.);',
/* дешеве сяйво: вісім відліків по колу, у квадраті — світиться лише яскраве */
' vec3 blm=vec3(0.);',
' for(int i=0;i<8;i++){',
'  float ang=float(i)*.7854; vec2 o=vec2(cos(ang),sin(ang));',
'  blm+=texture2D(uTex,vUv+o*texel*7.).rgb;}',
' blm*=.125*2.10;',
' float a=clamp(length(c)*1.5,0.,1.);',
' vec3 col=night(vUv)*(1.-a*.55)+c;',
' col+=blm*blm*1.45;',
' col+=vec3(1.)*spe*a*.55;',
' col=col/(1.+col*.22);',
' col=pow(max(col,0.),vec3(.90));',
' float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.545)*.012;',
' gl_FragColor=vec4(col+g-.006,1.);}'].join('\n');

  /* ---------- програми ---------- */
  const compile = (type, src) => {
    const o = gl.createShader(type);
    gl.shaderSource(o, src); gl.compileShader(o);
    return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
  };
  const vsh = compile(gl.VERTEX_SHADER, VS);
  if (!vsh) { cv.style.display = 'none'; return; }
  let broken = false;
  const program = fsSrc => {
    const fsh = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!fsh) { broken = true; return null; }
    const p = gl.createProgram();
    gl.attachShader(p, vsh); gl.attachShader(p, fsh);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { broken = true; return null; }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace('[0]','');
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u, use(){ gl.useProgram(p); return this; } };
  };
  const P = {
    splat:  program(FS_SPLAT),  advect: program(FS_ADVECT), div:  program(FS_DIV),
    curl:   program(FS_CURL),   vort:   program(FS_VORT),   press:program(FS_PRESS),
    grad:   program(FS_GRAD),   clear:  program(FS_CLEAR),  show: program(FS_SHOW)
  };
  if (broken) { cv.style.display = 'none'; return; }
  if (fall) fall.style.display = 'none';

  /* ---------- геометрія на весь екран ---------- */
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, -1,1, 1,1, 1,-1]), gl.STATIC_DRAW);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2, 0,2,3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  const blit = target => {
    if (target) { gl.viewport(0,0,target.w,target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else        { gl.viewport(0,0,cv.width,cv.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  /* ---------- буфери ---------- */
  const makeFBO = (w, h, fmt, filter) => {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.i, w, h, 0, fmt.f, HALF, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0,0,w,h);
    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, tx:1/w, ty:1/h,
             bind(id){ gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  };
  const makePair = (w, h, fmt, filter) => {
    let a = makeFBO(w,h,fmt,filter), b = makeFBO(w,h,fmt,filter);
    return { w, h, tx:1/w, ty:1/h,
             get read(){ return a; }, get write(){ return b; },
             swap(){ const t = a; a = b; b = t; } };
  };

  const SIM  = TOUCH ? 112 : 152;
  const DYE  = TOUCH ? 420 : 700;
  const resFor = base => {
    const ar = cv.width / Math.max(1, cv.height);
    return ar >= 1 ? { w: Math.round(base*ar), h: base } : { w: base, h: Math.round(base/ar) };
  };
  let dye, vel, prs, div, crl;
  const build = () => {
    const s = resFor(SIM), d = resFor(DYE);
    dye = makePair(d.w, d.h, F_RGBA, FILTER);
    vel = makePair(s.w, s.h, F_RG,   FILTER);
    prs = makePair(s.w, s.h, F_R,    gl.NEAREST);
    div = makeFBO (s.w, s.h, F_R,    gl.NEAREST);
    crl = makeFBO (s.w, s.h, F_R,    gl.NEAREST);
  };

  const MAXPX = TOUCH ? 1000000 : 1900000;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, TOUCH ? 1.5 : 1.75);
    let w = cv.clientWidth * dpr, h = cv.clientHeight * dpr;
    const k = Math.sqrt(MAXPX / Math.max(1, w*h));
    if (k < 1) { w *= k; h *= k; }
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; build(); }
  };
  size();

  /* ---------- параметри рідини ---------- */
  const CURL = 21, PRESS = .82, ITER = 18, DISS_V = .18, DISS_D = 1.85, RADIUS = .0026;
  const SPEED = .50;                                 // загальний темп течії

  const splat = (x, y, dx, dy, color) => {
    P.splat.use();
    gl.uniform1i(P.splat.u.uTarget, vel.read.bind(0));
    gl.uniform1f(P.splat.u.aspect, cv.width / cv.height);
    gl.uniform2f(P.splat.u.point, x, y);
    gl.uniform3f(P.splat.u.color, dx, dy, 0);
    gl.uniform1f(P.splat.u.radius, RADIUS);
    gl.uniform2f(P.splat.u.texel, vel.tx, vel.ty);
    blit(vel.write); vel.swap();

    gl.uniform1i(P.splat.u.uTarget, dye.read.bind(0));
    gl.uniform3f(P.splat.u.color, color[0], color[1], color[2]);
    gl.uniform2f(P.splat.u.texel, dye.tx, dye.ty);
    blit(dye.write); dye.swap();
  };

  /* три джерела ходять по власних траєкторіях і безперервно вливають фарбу */
  const SRC = [
    { fx:.044, fy:.061, px:1.7, py:0.4, ax:.37, ay:.27, c:[.780,1.00,.060], k:1.24 },
    { fx:.036, fy:.050, px:3.9, py:2.2, ax:.42, ay:.23, c:[.030,.330,1.00], k:.60 },
    { fx:.028, fy:.040, px:5.1, py:1.1, ax:.30, ay:.32, c:[.600,.060,1.00], k:.32 },
    { fx:.032, fy:.045, px:0.6, py:4.3, ax:.34, ay:.20, c:[.000,.960,.800], k:.34 },
    { fx:.024, fy:.035, px:2.8, py:5.6, ax:.26, ay:.29, c:[1.000,.060,.480], k:.24 }
  ];
  const srcAt = (s, t) => [ .5 + Math.sin(t*s.fx*6.28318 + s.px)*s.ax,
                            .5 + Math.cos(t*s.fy*6.28318 + s.py)*s.ay ];

  const pointer = { x:.5, y:.5, dx:0, dy:0, moved:false, hue:0 };
  const onMove = e => {
    const b = cv.getBoundingClientRect();
    const nx = (e.clientX - b.left) / b.width;
    const ny = 1 - (e.clientY - b.top) / b.height;
    pointer.dx = (nx - pointer.x) * 5.2;
    pointer.dy = (ny - pointer.y) * 5.2;
    pointer.x = nx; pointer.y = ny;
    pointer.moved = true;
  };
  hero.addEventListener('pointermove', onMove, { passive:true });
  hero.addEventListener('pointerdown', e => { onMove(e); pointer.dx *= 3; pointer.dy *= 3; }, { passive:true });

  const PAL = [[.847,1.,.243],[.13,.42,1.],[.60,.24,1.],[.0,.85,.86]];

  const stepSim = dt => {
    gl.disable(gl.BLEND);

    P.curl.use();
    gl.uniform2f(P.curl.u.texel, vel.tx, vel.ty);
    gl.uniform1i(P.curl.u.uVel, vel.read.bind(0));
    blit(crl);

    P.vort.use();
    gl.uniform2f(P.vort.u.texel, vel.tx, vel.ty);
    gl.uniform1i(P.vort.u.uVel, vel.read.bind(0));
    gl.uniform1i(P.vort.u.uCurl, crl.bind(1));
    gl.uniform1f(P.vort.u.curl, CURL);
    gl.uniform1f(P.vort.u.dt, dt);
    blit(vel.write); vel.swap();

    P.div.use();
    gl.uniform2f(P.div.u.texel, vel.tx, vel.ty);
    gl.uniform1i(P.div.u.uVel, vel.read.bind(0));
    blit(div);

    P.clear.use();
    gl.uniform2f(P.clear.u.texel, prs.tx, prs.ty);
    gl.uniform1i(P.clear.u.uTex, prs.read.bind(0));
    gl.uniform1f(P.clear.u.value, PRESS);
    blit(prs.write); prs.swap();

    P.press.use();
    gl.uniform2f(P.press.u.texel, prs.tx, prs.ty);
    gl.uniform1i(P.press.u.uDiv, div.bind(0));
    for (let i = 0; i < ITER; i++) {
      gl.uniform1i(P.press.u.uPress, prs.read.bind(1));
      blit(prs.write); prs.swap();
    }

    P.grad.use();
    gl.uniform2f(P.grad.u.texel, prs.tx, prs.ty);
    gl.uniform1i(P.grad.u.uPress, prs.read.bind(0));
    gl.uniform1i(P.grad.u.uVel, vel.read.bind(1));
    blit(vel.write); vel.swap();

    P.advect.use();
    gl.uniform2f(P.advect.u.texel, vel.tx, vel.ty);
    gl.uniform2f(P.advect.u.srcTexel, vel.tx, vel.ty);
    gl.uniform1i(P.advect.u.uVel, vel.read.bind(0));
    gl.uniform1i(P.advect.u.uSrc, vel.read.bind(0));
    gl.uniform1f(P.advect.u.dt, dt);
    gl.uniform1f(P.advect.u.diss, DISS_V);
    blit(vel.write); vel.swap();

    gl.uniform2f(P.advect.u.srcTexel, dye.tx, dye.ty);
    gl.uniform1i(P.advect.u.uVel, vel.read.bind(0));
    gl.uniform1i(P.advect.u.uSrc, dye.read.bind(1));
    gl.uniform1f(P.advect.u.diss, DISS_D);
    blit(dye.write); dye.swap();
  };

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold:0 }).observe(hero);
  addEventListener('resize', size);

  /* стартовий поштовх, щоб на першому ж кадрі вже було що дивитися */
  let seeded = false;
  const seed = () => {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.34, rr = .16 + (i % 3) * .09;
      splat(.5 + Math.cos(a)*rr*1.6, .5 + Math.sin(a)*rr,
            Math.cos(a)*560, Math.sin(a)*560,
            PAL[i % PAL.length].map(v => v * .55));
    }
    seeded = true;
  };

  const t0 = performance.now();
  let prev = t0;
  (function frame(now){
    requestAnimationFrame(frame);
    let dt = (now - prev) / 1000; prev = now;
    if (!visible || document.hidden) return;
    dt = Math.min(Math.max(dt, 1/240), 1/30);
    size();
    if (!seeded) seed();
    const time = (now - t0) / 1000;

    /* безперервні джерела */
    for (let i = 0; i < SRC.length; i++) {
      const s = SRC[i];
      const a = srcAt(s, time), b = srcAt(s, time + .05);
      const vx = (b[0]-a[0]) / .05, vy = (b[1]-a[1]) / .05;
      const pulse = .55 + .45 * Math.sin(time * (.31 + i*.13) + i*2.1);
      splat(a[0], a[1], vx*135*s.k, vy*135*s.k,
            [ s.c[0]*.105*s.k*pulse, s.c[1]*.105*s.k*pulse, s.c[2]*.105*s.k*pulse ]);
    }

    if (pointer.moved) {
      pointer.moved = false;
      const sp = Math.hypot(pointer.dx, pointer.dy);
      if (sp > .0004) {
        pointer.hue = (pointer.hue + 1) % PAL.length;
        const c = PAL[pointer.hue | 0];
        splat(pointer.x, pointer.y, pointer.dx*900, pointer.dy*900,
              [c[0]*.22, c[1]*.22, c[2]*.22]);
      }
      pointer.dx *= .55; pointer.dy *= .55;
    }

    stepSim(dt * SPEED);

    P.show.use();
    gl.uniform2f(P.show.u.texel, dye.tx, dye.ty);
    gl.uniform1i(P.show.u.uTex, dye.read.bind(0));
    gl.uniform1f(P.show.u.aspect, cv.width / cv.height);
    gl.uniform1f(P.show.u.time, time);
    blit(null);
  })(t0);
})();

/* ============ 7b. ПЛИТКИ ПОСЛУГ — світло і нахил за курсором ============ */
if (!TOUCH && !RM) $$('.tile').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', px * 100 + '%');
    el.style.setProperty('--my', py * 100 + '%');
    el.style.transform =
      `perspective(1100px) rotateX(${(.5 - py) * 4.5}deg) rotateY(${(px - .5) * 4.5}deg) translateY(-6px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ============ 8. MARQUEE ============ */
function buildMarquee(el){
  if (!el._items) el._items = [...el.children].map(n => n.cloneNode(true));   // запам'ятовуємо оригінал
  el.style.animation = 'none';
  el.innerHTML = '';
  el._items.forEach(n => el.appendChild(n.cloneNode(true)));
  const one = el.scrollWidth;                                                 // ширина однієї копії
  if (!one) return;
  const need = Math.ceil((el.parentElement.clientWidth * 2) / one) + 1;       // щоб вистачило на будь-який екран
  for (let i = 1; i < need; i++) el._items.forEach(n => el.appendChild(n.cloneNode(true)));
  el.style.setProperty('--mq-shift', one + 'px');
  el.style.setProperty('--mq-dur', Math.max(12, one / 55) + 's');             // стала швидкість 55 px/с
  void el.offsetWidth;
  el.style.animation = '';
}
const marquees = ['#tick1', '#tick2'].map(id => $(id)).filter(Boolean);
marquees.forEach(buildMarquee);
addEventListener('resize', () => marquees.forEach(buildMarquee));
window.__rebuildMarquees = () => marquees.forEach(buildMarquee);

/* ============ 9. PROCESS PIN ============ */
if (!RM) (() => {
  const pin = $('#process'), track = $('#track'), bar = $('#pinBar');
  if (!pin || !track) return;
  let cur = 0, tgt = 0, max = 0;
  const measure = () => { max = Math.max(0, track.scrollWidth - innerWidth + 48); };
  const upd = () => {
    const r = pin.getBoundingClientRect();
    const total = pin.offsetHeight - innerHeight;
    const prog = clamp(-r.top / (total || 1), 0, 1);
    tgt = prog * max;
    if (bar) bar.style.width = prog * 100 + '%';
  };
  (function loop(){
    cur = lerp(cur, tgt, .09);
    track.style.transform = `translate3d(${-cur}px,0,0)`;
    requestAnimationFrame(loop);
  })();
  addEventListener('scroll', upd, { passive:true });
  addEventListener('resize', () => { measure(); upd(); });
  measure(); upd(); setTimeout(() => { measure(); upd(); }, 900);
})();

/* ============ 10. FAQ ============ */
$$('.qa').forEach(qa => {
  const q = $('.qa__q', qa), a = $('.qa__a', qa);
  q.setAttribute('aria-expanded', 'false');
  q.addEventListener('click', () => {
    const open = qa.classList.contains('on');
    $$('.qa.on').forEach(o => {
      o.classList.remove('on'); $('.qa__a', o).style.height = '0px';
      $('.qa__q', o).setAttribute('aria-expanded', 'false');
    });
    if (!open) { qa.classList.add('on'); a.style.height = a.scrollHeight + 'px'; q.setAttribute('aria-expanded', 'true'); }
  });
});
addEventListener('resize', () => $$('.qa.on').forEach(o => {
  $('.qa__a', o).style.height = $('.qa__a', o).scrollHeight + 'px';
}));

/* ============ 10.5 LAZY SHOWREEL ============ */
(() => {
  const video = $('#showreel'), button = $('#reelToggle');
  if (!video || !button) return;
  let loaded = false;
  const icon = $('.reel__icon', button);
  const label = $('[data-i18n="reel_play"]', button);
  const update = () => {
    const playing = !video.paused && !video.ended;
    button.setAttribute('aria-pressed', String(playing));
    if (icon) icon.textContent = playing ? 'Ⅱ' : '▶';
    if (label) label.textContent = playing ? L('Пауза','Pause') : L('Відтворити','Play');
  };
  const load = () => {
    if (loaded) return;
    loaded = true;
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
    video.load();
  };
  button.addEventListener('click', async () => {
    load();
    if (video.paused) await video.play().catch(() => {}); else video.pause();
    update();
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('ended', update);
  new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (visible) {
      load();
      if (!RM) video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  }, { rootMargin:'320px 0px', threshold:.12 }).observe(video);
})();

/* ============ 11. MOBILE MENU ============ */
(() => {
  const b = $('#burger'), mm = $('#mm');
  if (!b) return;
  const toggle = f => {
    const on = f ?? !mm.classList.contains('on');
    mm.classList.toggle('on', on); b.classList.toggle('on', on);
    b.setAttribute('aria-expanded', String(on));
    document.body.classList.toggle('lock', on);
  };
  b.setAttribute('aria-expanded', 'false');
  b.addEventListener('click', () => toggle());
  $$('#mm a').forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => e.key === 'Escape' && toggle(false));
})();

/* ============ 12. CALCULATOR ============ */
(() => {
  const box = $('#calc'); if (!box) return;
  const out = { main:$('#sumMain'), alt:$('#sumAlt'), pack:$('#sumPack'), t:$('#sumTime'), f:$('#sumFirst') };
  const labelOf = input => input.nextElementSibling?.textContent.trim() || input.dataset.lab || '';
  const round100 = n => Math.max(500, Math.round(n / 100) * 100);
  const calc = () => {
    const type = $('input[name=type]:checked', box);
    const design = $('input[name=design]:checked', box);
    const motion = $('input[name=motion]:checked', box);
    const speed = $('input[name=speed]:checked', box);
    const adds = $$('#q-add input:checked', box);
    const featureFactor = 1 + adds.reduce((sum, a) => sum + +(a.dataset.k || 0), 0);
    const featureDays = adds.reduce((sum, a) => sum + +(a.dataset.w || 0), 0);
    const base = +(MARKET === 'ua' ? type.dataset.baseUa : type.dataset.baseGlobal) || +type.value;
    const price = base * +design.value * +motion.value * featureFactor * +speed.value;
    const days = Math.max(10, Math.round((+type.dataset.w + featureDays) * +design.dataset.w * +motion.dataset.w * +speed.dataset.w));
    const lo = round100(price), hi = round100(price * 1.28);
    out.main.textContent = money(lo) + ' – ' + money(hi);
    const alt = 'usd';
    out.alt.textContent = '≈ ' + moneyIn(lo, alt) + ' – ' + moneyIn(hi, alt);
    out.pack.textContent = type.dataset.pack;
    out.t.textContent = days < 21 ? `${days}–${days+5} ${L('днів','days')}`
                                  : `${Math.max(2,Math.round(days/7))}–${Math.max(3,Math.round(days/7)+2)} ${L('тижнів','weeks')}`;
    out.f.textContent = money(Math.round(lo * .4));
    box.dataset.brief = [
      L('Продукт','Product') + ': ' + labelOf(type),
      L('Дизайн','Design') + ': ' + labelOf(design),
      'Motion: ' + labelOf(motion),
      adds.length ? L('Функції','Features') + ': ' + adds.map(labelOf).join(', ') : '',
      L('Темп','Pace') + ': ' + labelOf(speed),
      L('Формат','Recommended format') + ': ' + type.dataset.pack,
      L('Орієнтир','Estimate') + ': ' + money(lo) + ' – ' + money(hi),
      L('Строк','Timeline') + ': ' + out.t.textContent,
      'Market: ' + (MARKET === 'ua' ? 'Ukraine / Launch' : 'Global / Custom'),
      'Estimator: pricing-v3'
    ].filter(Boolean).join('\n');
  };
  box.addEventListener('change', calc);
  window.__recalc = calc;
  calc();
  $('#calcGo')?.addEventListener('click', () => {
    const ta = $('#form [name=msg]');
    if (ta) ta.value = L('Порахував у калькуляторі:\n','Calculated on site:\n') + box.dataset.brief + '\n\n';
    setTimeout(() => $('#form [name=name]')?.focus(), 700);
  });
})();

$$('#pricing [data-pack]').forEach(b => b.addEventListener('click', () => {
  const sel = $('#form [name=ptype]');
  if (sel && b.dataset.ptype != null) sel.selectedIndex = +b.dataset.ptype;
  const ta = $('#form [name=msg]');
  if (ta && !ta.value) ta.value = L(`Цікавить пакет «${b.dataset.pack}». `, `Interested in the "${b.dataset.pack}" package. `);
}));

/* ============ 13. FORM ============ */
(() => {
  const f = $('#form'); if (!f) return;
  const submit = $('button[type="submit"]', f);
  const status = $('#formStatus');
  /* класична POST-відправка в невидимий iframe: сторінка не перезавантажується,
     а браузер не застосовує до неї CORS, бо це не XHR */
  const postThroughFrame = fields => {
    try {
      const name = 'ixf' + Date.now();
      const fr = document.createElement('iframe');
      fr.name = name; fr.style.display = 'none'; fr.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fr);
      const form = document.createElement('form');
      form.action = CFG.formEndpoint.replace('/ajax/', '/');
      form.method = 'POST'; form.target = name; form.style.display = 'none';
      const add = (k, v) => {
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i);
      };
      Object.keys(fields).forEach(k => add(k, fields[k]));
      add('_captcha', 'false');
      add('_template', 'table');
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => { form.remove(); fr.remove(); }, 60000);
      return true;
    } catch(_) { return false; }
  };

  const setStatus = (text, kind = '', html = false) => {
    if (!status) return;
    if (html) status.innerHTML = text; else status.textContent = text;
    status.className = 'form__status' + (kind ? ` ${kind}` : '');
  };
  const flash = t => {
    const n = document.createElement('div');
    n.textContent = t;
    n.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:9999;padding:13px 22px;border-radius:100px;background:#D8FF3E;color:#07070A;font-weight:700;font-size:.87rem;box-shadow:0 12px 40px #0006;max-width:90vw;text-align:center';
    document.body.appendChild(n);
    setTimeout(() => { n.style.transition='opacity .4s'; n.style.opacity='0'; setTimeout(()=>n.remove(),400); }, 3400);
  };
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d._honey) return;
    const body =
`${L("Ім'я",'Name')}: ${d.name}
${L('Компанія','Company')}: ${d.company || '—'}
Email: ${d.email}
${L('Контакт','Contact')}: ${d.phone || '—'}
${L('Країна','Country')}: ${d.country || '—'}
Website: ${d.website || '—'}
${L('Тип проєкту','Project')}: ${d.ptype}
${L('Бюджет','Budget')}: ${d.budget}
${L('Бажаний старт','Preferred start')}: ${d.deadline}

${L('Задача','Task')}:
${d.msg}

—
${L('Надіслано з сайту ixonity','Sent from the ixonity site')}`;
    /* Тема одразу каже, що за заявка: тип, бюджет, ім'я */
    const subject = L('Заявка: ', 'Enquiry: ') +
      [d.ptype, d.budget, d.name].filter(Boolean).join(' · ');

    /* Поля з людськими назвами: FormSubmit друкує їх як таблицю,
       тому лист читається без розшифровок */
    const fields = {};
    fields[L("Ім'я", 'Name')]                       = d.name || '—';
    fields[L('Компанія', 'Company')]                = d.company || '—';
    fields['Email']                                 = d.email || '—';
    fields[L('Телефон / Telegram', 'Phone / Telegram')] = d.phone || '—';
    fields[L('Країна', 'Country')]                  = d.country || '—';
    fields[L('Поточний сайт', 'Current website')]   = d.website || '—';
    fields[L('Тип проєкту', 'Project type')]        = d.ptype || '—';
    fields[L('Бюджет', 'Budget')]                   = d.budget || '—';
    fields[L('Бажаний старт', 'Preferred start')]   = d.deadline || '—';
    fields[L('Задача', 'Brief')]                    = d.msg || '—';
    fields[L('Сторінка', 'Page')]                   = location.href;
    fields[L('Мова сайту', 'Site language')]        = (LANG || 'ua').toUpperCase();
    if (!CFG.formEndpoint) {
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    submit.disabled = true;
    setStatus(L('Надсилаємо захищений brief…','Sending your brief…'));
    try {
      /* Тіло як form-urlencoded і без власних заголовків: браузер не робить
         preflight-запит, тому політика CORS не може заблокувати відправку. */
      const payload = new URLSearchParams({
        ...fields,
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        _replyto: d.email || CFG.email
      });
      const r = await fetch(CFG.formEndpoint, { method:'POST', body:payload });
      const result = await r.json().catch(() => ({}));
      if (!r.ok || result.success === 'false' || result.success === false) throw new Error('form endpoint rejected request');
      setStatus(L('Дякуємо — заявку надіслано. Відповімо протягом робочого дня.','Thank you — your enquiry was sent. We reply within one business day.'), 'ok');
      flash(L('Заявку надіслано.','Enquiry sent.'));
      f.reset();
    } catch(_) {
      /* Запасний шлях: звичайна відправка форми в прихований iframe.
         Це не fetch, тож правила CORS до неї не застосовуються взагалі. */
      if (postThroughFrame({ ...fields, _subject: subject, _replyto: d.email || CFG.email })) {
        setStatus(L('Дякуємо — заявку надіслано. Відповімо протягом робочого дня.','Thank you — your enquiry was sent. We reply within one business day.'), 'ok');
        flash(L('Заявку надіслано.','Enquiry sent.'));
        f.reset();
      } else {
        const mail = `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        try { await navigator.clipboard.writeText(body); } catch(_e) {}
        setStatus(
          L('Не вдалося надіслати автоматично. Бриф скопійовано в буфер — ',
            'Automatic sending failed. The brief is copied to the clipboard — ') +
          `<a href="${mail}">` + L('надішліть його листом', 'send it by email') + '</a>' +
          L(', або напишіть на ixonity@gmail.com.', ', or write to ixonity@gmail.com.'),
          'err', true);
      }
    } finally {
      submit.disabled = false;
    }
  });
})();

/* ============ 14. i18n ============ */
const EN = {
  pre:'assembling pixel by pixel',
  nav1:'Services', nav2:'Process', nav3:'Work', nav4:'Pricing', 
  nav6:'Estimate project', nav7:'Contact', nav_cta:'Start a project', mm_hint:'Quick contact',
  badge:'Open to new projects',
  h1a:'Digital', h1b:'products', h1c:'built to matter',
  hsub:'Strategy, UX/UI, web, mobile and advanced interactive development — from the first idea to launch and continuous product growth.',
  cta1:'Start a project', cta2:'View our work', tk2:'Working <em>worldwide</em>',
  tk4:'Contract · invoice <em>· NDA</em>', tk5:'You own <em>the source code</em>',
  from:'from', range:'typical', permo:'/mo',
  s_title:'What we build',
  s_lead:'Research, design, code, launch and support in one pair of hands. No chain of contractors.',
  sv1t:'Premium websites',
  sv1d:'Strategy, art direction, UX/UI, development, CMS, motion, SEO and launch — one accountable team.',
  sv1time:'2–12 weeks',
  sv2t:'E-commerce', sv2d:'Commerce UX, payments, catalogue, customer account, inventory and CRM integrations.', sv2time:'8–16 weeks',
  sv3t:'Mobile products', sv3d:'iOS, Android and cross-platform MVPs with thoughtful UX and store-ready delivery.', sv3time:'10–20 weeks',
  sv4t:'Web apps & SaaS',
  sv4d:'Dashboards, CRM, marketplaces, booking and internal software backed by reliable product architecture.',
  sv4time:'10–24 weeks',
  sv5t:'Product design', sv5d:'Research, user flows, prototypes, UI and a scalable design system.', sv5time:'3–8 weeks',
  sv6t:'WebGL & interactive', sv6d:'3D, shaders, configurators, motion and interactive brand experiences.', sv6time:'5–12 weeks',
  sv7t:'Product development', sv7d:'Support, analytics and structured product growth after launch.', sv7time:'long-term',
  p_title:'How we work',
  p1t:'The call', p1d:'30–40 minutes. We unpack the task, the business goal, the budget. No jargon. Free, no strings attached.', p1x:'Day 0 · free',
  p2t:'Estimate & plan', p2d:'You get a document: what is included, what is not, the cost, the timeline. A fixed price, not a "roughly".', p2x:'1–2 days',
  p3t:'Design', p3d:'Prototype → Figma mockups. You see the product before a single line of code is written. Two rounds of revisions included.', p3x:'5–14 days',
  p4t:'Development', p4d:'We work in sprints. Once a week: a demo and a live link. You always see what you are paying for.', p4x:'2–10 weeks',
  p5t:'Launch', p5d:'Testing, migration to your hosting, store submission, analytics. We hand over every access key and the source code.', p5x:'2–5 days',
  p6t:'Support', p6d:'Six months of free bug fixing. After that — a monthly plan or hourly work, whichever suits you.', p6x:'6-month warranty',
  w_title:'Already shipped',
  w_lead:'Products in production, not concepts. Two apps on the App Store and our own R&amp;D engine.',
  c1d:'A full furniture store inside an app: filtered catalogue, cart, orders, Monobank acquiring, behaviour analytics, a manager dashboard. From mockup to App Store release — built from the first line.',
  c2d:'A QR generator at commercial-tool level: custom eyes and frames, branding, dynamic codes, scan statistics, print-quality export.',
  c3d:'Our own planetary 3D engine on WebGPU: volumetric clouds with Rayleigh/Mie scattering, climate simulation over a million particles, seamless LOD. We build it to stay sharp on the hardest graphics.',
  c_open:'View case study', c_follow:'View the R&D case',
  r1:'Fixed price', r2:'Signed contract', r3:'You own the code', r4:'6-month warranty',
  r5:'Weekly demos', r6:'No 100% upfront',
  pr_title:'Clear ranges. No fog.',
  pr_lead:'Ranges for custom work. The exact figure is fixed after discovery.',
  pr_legal:'This is an estimated investment, not a legally binding offer. Ukrainian clients are invoiced in hryvnia; international projects in the contract currency. Final pricing follows a scoped discovery.',
  market_ua:'Ukraine', market_ua_sub:'launch scope · billed in UAH',
  market_global:'Global', market_global_sub:'custom scope · USD / EUR',
  ua1t:'Launch landing', ua1x:'2–3 weeks',
  ua1a:'One language and one primary journey', ua1b:'Content and brand assets supplied by the client', ua1c:'Custom UI, responsive build and essential motion', ua1d:'Form, analytics and technical SEO',
  ua2t:'Business website', ua2x:'4–7 weeks',
  ua2a:'5–10 core pages', ua2b:'UX/UI and a compact design system', ua2c:'CMS, form and essential integrations', ua2d:'One language, performance and launch',
  ua3t:'Local e-commerce', ua3x:'6–12 weeks',
  ua3a:'A catalogue of agreed size', ua3b:'One payments and delivery stack', ua3c:'Cart, orders and customer account', ua3d:'No complex ERP automation',
  ua4t:'Product MVP', ua4x:'8–16 weeks',
  ua4a:'Discovery and one core user flow', ua4b:'UX/UI, frontend and backend', ua4c:'A bounded integration set', ua4d:'First production release and roadmap',
  pk1t:'Landing', pk1x:'2–4 weeks',
  pk1a:'Strategy and offer structure', pk1b:'Custom UX/UI without templates', pk1c:'Responsive development',
  pk1d:'CMS or form integration', pk1e:'SEO foundation and analytics', pk1f:'QA, deployment and launch',
  pk_pop:'most popular', pk2t:'Premium website', pk2x:'6–12 weeks',
  pk2a:'Art direction and product strategy', pk2b:'Information architecture and UX', pk2c:'Custom UI and design system',
  pk2d:'Advanced motion and micro interactions', pk2e:'CMS, integrations and multilingual', pk2f:'Performance, SEO and accessibility', pk2g:'QA, launch and warranty',
  pk3t:'E-commerce', pk3x:'8–16 weeks',
  pk3a:'Conversion-focused UX/UI', pk3b:'Catalogue, search and filters', pk3c:'Payments, delivery and taxes',
  pk3d:'Customer account and order history', pk3e:'CRM, ERP and inventory integrations', pk3f:'Analytics, QA and launch',
  pk4t:'Product MVP', pk4x:'10–20 weeks',
  pk4a:'Discovery and product scope', pk4b:'UX/UI and interactive prototype', pk4c:'Web app or mobile product',
  pk4d:'Backend, admin and integrations', pk4e:'QA, release and monitoring', pk4f:'Plan for the next iterations',
  pk_btn:'Discuss',
  cl_title:'Estimate the scope',
  cl_lead:'The base product is multiplied by design complexity, motion, features and pace.',
  h1:'Landing is a one-page site built around a single goal. The other formats are multi-page products.',
  h2:'How distinctive the look is — from a tidy template to a fully original design.',
  h3:'Animation and response to actions: from static to 3D graphics in the browser.',
  h4:'What the site can do beyond showing information. Each item adds work.',
  h5:'Faster than the normal pace means overtime, so it costs more.',
  q1:'1. What are we building?', q2:'2. Design level', q_motion:'3. Motion & interaction', q_features:'4. Features', q3:'5. Pace',
  o_land:'Landing', o_corp:'Premium website', o_shop:'E-commerce', o_app:'Mobile App', o_saas:'Web App / SaaS', o_ux:'UI/UX', o_webgl:'Interactive / WebGL',
  d1:'Essential', d2:'Premium', d3:'Custom', d4:'Experimental',
  m1:'No motion', m2:'Micro interactions', m3:'Advanced', m4:'WebGL / 3D',
  a1:'CMS', a2:'Payments', a3:'Authentication / account', a4:'Admin',
  a5:'CRM / API', a6:'AI integration', a7:'Multilingual', a8:'Advanced analytics',
  sp1:'Standard', sp2:'Fast (+20%)', sp3:'Urgent (+40%)',
  cl_est:'estimated investment', cl_pack:'Recommended format', cl_time:'Timeline', cl_start:'First payment (40%)',
  cl_sup:'Product growth after launch', cl_sup_v:'from $500/mo', cl_btn:'Get a detailed proposal',
  cl_note:'This estimate is a typical range, not an offer. After discovery we define the scope, exclusions, stages, timeline and final price.',
  f_title:'What people ask',
  f1q:'Honestly — how much does a website cost?',
  f1a:'A landing typically ranges from <span data-usd-range="600,1100" data-market-faq-range></span>. Complex websites, e-commerce and products scale with UX, integrations and motion. After discovery you receive a proposal with a fixed scope and price.',
  f2q:'Will there be a contract and paperwork?',
  f2a:'Yes. We operate as a registered Ukrainian sole proprietorship (FOP Oleksii Zaitsev), sign a contract with a specification annex, and issue an invoice and a completion act for your accountant.',
  f3q:'Who owns the code and design after payment?',
  f3a:'You do. On final payment we hand over the source code, Figma files and every access key: hosting, domain, databases, store accounts. You are not technically locked to us.',
  f4q:'What if I do not like the result?',
  f4a:'You see and approve the design before programming starts, with two free rounds of revisions. During development you get a live link every week — so there is never a surprise at the end.',
  f5q:'What does support cost afterwards?',
  f5a:'Bugs in our code are fixed free for 6 months. After that, product support starts from <span data-usd="337" data-market-support-price></span> per month: monitoring, updates, backups, analytics review and planned development.',
  f6q:'Do you publish the app to the stores yourselves?',
  f6a:'Yes. We help register your Apple Developer and Google Play accounts, prepare screenshots and copy, pass review and fix any rejections. We already have two of our own apps on the App Store.',
  f7q:'Do you work outside Odesa?',
  f7a:'All over Ukraine. Everything runs online: calls, Figma, demo links, digitally signed documents. An in-person meeting in Odesa is available if you want one.',
  f8q:'What if I am not in Ukraine?',
  f8a:'We work with clients in the EU, the UK and the US. Contract and correspondence in English, invoice in the contract currency (USD or EUR), payment by bank transfer, Wise or Payoneer. Odesa sits at UTC+2/+3, so the working day overlaps almost fully with Europe and leaves a solid afternoon window with the US East Coast.',
  ct_title:'Let us start',
  ct_lead:'Describe the task in two sentences. We reply within one business day.',
  fn:'Name', fcompany:'Company', fp:'Telegram / WhatsApp', fe:'Email', fcountry:'Country', fwebsite:'Current website', ft:'Project type',
  ft1:'Landing', ft2:'Premium website', ft3:'E-commerce', ft4:'Mobile product',
  ft5:'Web App / SaaS', ft6:'Interactive / WebGL', ft7:'Not sure yet',
  fb:'Estimated budget', fb1:'under €2,000', fb2:'€2,000 – €5,000', fb3:'€5,000 – €10,000', fb4:'€10,000 – €25,000', fb5:'€25,000+', fb6:'need advice',
  fdeadline:'Preferred start', fd1:'Flexible', fd2:'Within a month', fd3:'1–3 months', fd4:'3+ months',
  fm:'About the product, goal and key features', fsend:'Send enquiry',
  fhint:'Your brief is securely delivered to our inbox through FormSubmit. By sending it, you agree to the <a href="privacy.html">privacy policy</a>. Add files as Figma or Drive links.',
  ch_call:'Call us', ch_legal:'Legal details', ch_tax:'Registered sole proprietor · contract & act',
  ftn1:'Services', ftl1:'Websites & landings', ftl2:'Online stores', ftl3:'Mobile apps',
  ftl4:'Backend & integrations', ftl5:'Design & automation',
  ftn2:'Studio', ftl6:'Work', ftl7:'Process', ftl8:'Pricing',  ftl9:'FAQ',
  ftn3:'Contact', ftn4:'Documents', ftl10:'Privacy policy', ftl11:'Terms of use', ftl12:'Legal details',
  ft_fop:'Sole proprietor O. Zaitsev', ft_made:'Odesa, Ukraine 🇺🇦 · working with UA, EU, UK, US',
  mb1:'Call', mb2:'WhatsApp', mb3:'Estimate'
};

const UA = {};
$$('[data-i18n]').forEach(el =>
  // у разбитых на буквы заголовков берём чистый текст, иначе при возврате на UA
  // в них попадёт собственная разметка
  UA[el.dataset.i18n] = el.classList.contains('split') ? el.textContent : el.innerHTML);

const META = {
  uk: {
    title:'Ixonity — digital product studio з України',
    description:'Ixonity проєктує та створює цифрові продукти: premium websites, e-commerce, web apps, iOS, Android, UI/UX і WebGL. Базуємося в Україні, працюємо по всьому світу.'
  },
  en: {
    title:'Ixonity — Digital Product Studio from Ukraine',
    description:'Ixonity designs and builds premium websites, e-commerce, web apps, mobile products, UI/UX and interactive WebGL experiences for clients worldwide.'
  }
};

function setLang(l){
  LANG = l;
  localStorage.setItem('ix_lang', l);
  document.documentElement.lang = l;
  document.title = META[l].title;
  $('meta[name="description"]').content = META[l].description;
  $('meta[property="og:title"]').content = META[l].title;
  $('meta[property="og:description"]').content = META[l].description;
  $('meta[property="og:locale"]').content = l === 'uk' ? 'uk_UA' : 'en_US';
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const v = l === 'uk' ? UA[k] : (EN[k] ?? UA[k]);
    if (v == null) return;
    if (el.classList.contains('split') && !RM) { el.textContent = v; splitInto(el); el.classList.add('in'); }
    else el.innerHTML = v;
  });
  $$('.work[data-case]').forEach(link => {
    link.href = ROUTE_LANG ? `cases/${link.dataset.case}.html` : `${l === 'uk' ? 'ua' : 'en'}/cases/${link.dataset.case}.html`;
  });
  const privacyLink = $('[data-i18n="fhint"] a');
  if (privacyLink) privacyLink.href = ROUTE_LANG ? '../privacy.html' : 'privacy.html';
  setMarket(MARKET);
  $$('.lang button[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  renderPrices();
}
$$('.lang button[data-lang]').forEach(b => b.addEventListener('click', () => {
  const l = b.dataset.lang;
  localStorage.setItem('ix_lang', l);
  if (ROUTE_LANG) location.href = l === 'uk' ? '../ua/' : '../en/';
  else setLang(l);
}));
setMarket(MARKET);
if (LANG === 'en' || ROUTE_LANG) setLang(LANG);
renderPrices();
resolveMarket();

/* ============ 15. ANCHORS + MISC ============ */
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  const y = t.getBoundingClientRect().top + scrollY - (a.getAttribute('href') === '#top' ? 0 : 74);
  scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
}));
$('#yr').textContent = new Date().getFullYear();
})();
