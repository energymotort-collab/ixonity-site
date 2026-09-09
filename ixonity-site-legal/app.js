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
const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Kyiv';
const ukrainianBrowser = (navigator.languages || [navigator.language]).some(lang => /^uk\b/i.test(lang || ''));
let LANG = ROUTE_LANG || (savedLang === 'uk' || savedLang === 'en' ? savedLang : (localTimezone || ukrainianBrowser ? 'uk' : 'en'));
if (!ROUTE_LANG && location.protocol !== 'file:') {
  location.replace((localTimezone || ukrainianBrowser ? 'ua/' : 'en/') + location.hash);
  return;
}
const L = (uk, en) => LANG === 'uk' ? uk : en;
let MARKET = localTimezone ? 'ua' : 'global';

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
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    setMarket(localTimezone ? 'ua' : 'global');
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
  words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'w-w';
    [...w].forEach((ch, ci) => {
      const wrap = document.createElement('span'); wrap.className = 'ch-w';
      const inner = document.createElement('span'); inner.className = 'ch-i';
      inner.textContent = ch;
      inner.style.transitionDelay = (wi * 30 + ci * 20) + 'ms';
      wrap.appendChild(inner); word.appendChild(wrap);
    });
    el.appendChild(word);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
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

/* ============ 7. HERO — рідкий метал (WebGL) ============ */
(() => {
  const cv = $('#gl'), fall = $('#glFall'), hero = $('.hero');
  if (!cv || RM) { if (cv) cv.style.display = 'none'; return; }
  let gl = null;
  try { gl = cv.getContext('webgl', { antialias:false, alpha:false, powerPreference:'high-performance' })
             || cv.getContext('experimental-webgl'); } catch(e){}
  if (!gl) { cv.style.display = 'none'; return; }

  const N = 6;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = [
'precision highp float;',
'uniform vec2 r;uniform float t;uniform float melt;uniform vec4 cursor;',
'uniform vec3 b[' + N + '];',                         // x,y (0..1), z = радіус рідкої маси
'float smin(float a,float c,float k){float h=clamp(.5+.5*(c-a)/k,0.,1.);return mix(c,a,h)-k*h*(1.-h);}',
'float oval(vec2 p,vec3 v,vec2 shape,float mn){',
' vec2 axis=max(vec2(1.),v.z*mn*shape);',
' vec2 q=(p-v.xy*r)/axis;',
' return (length(q)-1.)*min(axis.x,axis.y);}',
'float mapf(vec2 p){',
' float mn=min(r.x,r.y);',
' float k=mn*(.040+.024*melt);',
' float d=oval(p,b[0],vec2(1.20,.88),mn);',
' d=smin(d,oval(p,b[1],vec2(1.02,.96),mn),k);',
' d=smin(d,oval(p,b[2],vec2(1.08,.94),mn),k);',
' d=smin(d,oval(p,b[3],vec2(.96,1.08),mn),k);',
' d=smin(d,oval(p,b[4],vec2(1.04,.98),mn),k);',
' d=smin(d,oval(p,b[5],vec2(.98,1.03),mn),k*.88);',
' vec2 q=p/mn;',
' d+=(sin(q.x*2.8+t*.36)*sin(q.y*3.2-t*.29)+sin(q.x*5.1-q.y*1.7-t*.21)*.32)*mn*.0025;',
' return d;}',
'vec3 oil(float x){',
' vec3 c=.5+.5*cos(6.28318*(x+vec3(0.,.31,.67)));',
' return c*c;}',
'vec3 bgAt(vec2 q,float ar){',
' vec3 c=vec3(.010,.010,.017);',
' c+=vec3(.35,.18,.90)*.18*exp(-length((q-vec2(.17,.82))*vec2(ar,1.))*3.0);',
' c+=vec3(.95,.12,.40)*.13*exp(-length((q-vec2(.84,.80))*vec2(ar,1.))*3.1);',
' c+=vec3(.00,.58,.52)*.11*exp(-length((q-vec2(.82,.20))*vec2(ar,1.))*3.3);',
' return c;}',
'vec3 chrome(vec3 rd,float u,float ang){',
' vec3 c=vec3(.025,.030,.026);',
' c+=vec3(.80,.98,.34)*(.18+.24*u);',
' c+=vec3(.92,1.,.86)*pow(max(0.,1.-abs(rd.y-.22)),18.)*.82;',
' c+=vec3(.38,.47,.30)*pow(max(0.,1.-abs(rd.y+.38)),7.)*.54;',
' c+=vec3(.96,.98,1.)*pow(max(rd.x*.72+rd.y*.35,0.),22.)*.90;',
' c+=oil(ang*1.35+t*.022+u*.15)*pow(1.-abs(rd.z),2.3)*.48;',
' return c;}',
'void main(){',
' vec2 p=gl_FragCoord.xy;float mn=min(r.x,r.y);float ar=r.x/r.y;',
' float d=mapf(p);',
' float gs=max(1.6,mn*.0032);',
' vec2 gr=vec2(mapf(p+vec2(gs,0.))-mapf(p-vec2(gs,0.)),',
'              mapf(p+vec2(0.,gs))-mapf(p-vec2(0.,gs)));',
' vec2 g=normalize(gr+vec2(1e-6));',
' float u=clamp(-d/(mn*.095),0.,1.);',
' vec2 uv=p/r;',
' vec2 flowN=vec2(',
'   sin(uv.y*10.3+uv.x*3.7-t*.68)+cos((uv.x+uv.y)*7.1+t*.36),',
'   cos(uv.x*9.6-uv.y*2.6+t*.53)-sin((uv.x-uv.y)*7.8-t*.31)',
' )*.052;',
' vec2 cd=(uv-cursor.xy)*vec2(ar,1.);',
' float cl=length(cd);',
' float ripple=sin(cl*29.-t*4.2)*exp(-cl*5.0)*cursor.z;',
' flowN+=normalize(cd+vec2(1e-5,0.))*ripple*.18;',
' float edgeSlope=mix(1.65,.18,smoothstep(.02,.82,u));',
' vec3 n=normalize(vec3(g*edgeSlope+flowN*(.48+u*.72),.72+u*.64));',
' vec3 view=vec3(0.,0.,1.);vec3 rd=reflect(-view,n);',
' float ang=atan(g.y,g.x)/6.28318;',
' vec3 L=normalize(vec3(-.46,.72,.53));',
' float spec=pow(max(dot(reflect(-L,n),view),0.),86.);',
' float fres=pow(1.-clamp(n.z,0.,1.),2.2);',
' vec3 base=bgAt(p/r,ar);',
' vec3 refr=bgAt((p+n.xy*mn*(.055+.072*fres))/r,ar);',
' vec3 metal=chrome(rd,u,ang);',
' float vein=pow(.5+.5*sin(uv.x*21.+sin(uv.y*9.-t*.47)*2.4-t*.72),10.)*u;',
' metal=mix(refr*1.34,metal,.82);',
' metal+=vec3(1.,1.,.96)*spec*1.28;',
' metal+=oil(uv.x*.46-uv.y*.28+t*.026)*vein*.14;',
' metal+=vec3(.847,1.,.243)*fres*.10;',
' float body=1.-smoothstep(-1.25,1.25,d);',
' float rim=exp(-(d*d)/1.9);',
' float aura=exp(-abs(d)/(mn*.030));',
' vec3 col=mix(base,metal,body);',
' col+=oil(ang*1.28+t*.020+uv.x*.08)*rim*(1.52+.46*fres);',
' col+=vec3(.847,1.,.243)*aura*.042;',
' col=pow(max(col,0.),vec3(.91));',
' float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.545)*.013;',
' gl_FragColor=vec4(col+grain-.0065,1.);',
'}'].join('\n');

  const sh = (type, src) => {
    const o = gl.createShader(type);
    gl.shaderSource(o, src); gl.compileShader(o);
    return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { cv.style.display = 'none'; return; }
  const pr = gl.createProgram();
  gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.style.display = 'none'; return; }
  gl.useProgram(pr);
  if (fall) fall.style.display = 'none';

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uR = gl.getUniformLocation(pr,'r'),
        uT = gl.getUniformLocation(pr,'t'),
        uM = gl.getUniformLocation(pr,'melt'),
        uC = gl.getUniformLocation(pr,'cursor'),
        uB = gl.getUniformLocation(pr,'b[0]');

  /* Одна абстрактна рідка скульптура збирається, розділяється на кілька
     великих фрагментів і знову стікається. Матеріал при цьому незмінний. */
  const RAD = [.230,.158,.171,.137,.143,.122];
  const FORM_A = [[.50,.50],[.28,.54],[.72,.49],[.43,.70],[.58,.30],[.85,.59]];
  const FORM_B = [[.48,.49],[.18,.58],[.77,.53],[.40,.77],[.62,.22],[.89,.68]];
  const drops = FORM_A.map((p, i) => ({ x:p[0], y:p[1], vx:0, vy:0, r:RAD[i], cr:RAD[i] }));
  const data = new Float32Array(N * 3);
  const mouse = {
    tx:.58, ty:.52, x:.58, y:.52, on:false, power:0,
    tvx:0, tvy:0, vx:0, vy:0, energy:0, lastAt:0, seen:false
  };
  const follow = (rate, dt) => 1 - Math.exp(-rate * dt);

  const pointer = e => {
    const bx = cv.getBoundingClientRect();
    const nx = clamp((e.clientX - bx.left) / bx.width, -.08, 1.08);
    const ny = clamp(1 - (e.clientY - bx.top) / bx.height, -.08, 1.08);
    const now = performance.now();
    const edt = (now - mouse.lastAt) / 1000;
    if (mouse.seen && edt > .004 && edt < .14) {
      mouse.tvx = clamp((nx - mouse.tx) / edt, -2.8, 2.8);
      mouse.tvy = clamp((ny - mouse.ty) / edt, -2.8, 2.8);
    }
    mouse.tx = nx; mouse.ty = ny;
    mouse.lastAt = now; mouse.seen = true;
    mouse.on = true;
  };
  hero.addEventListener('pointerenter', pointer, { passive:true });
  hero.addEventListener('pointermove', pointer, { passive:true });
  hero.addEventListener('pointerdown', e => {
    pointer(e);
    mouse.power = 1;
    mouse.energy = Math.max(mouse.energy, .82);
  }, { passive:true });
  const releasePointer = () => {
    mouse.on = false; mouse.seen = false; mouse.tvx = 0; mouse.tvy = 0;
  };
  hero.addEventListener('pointerleave', releasePointer);
  hero.addEventListener('pointercancel', releasePointer);
  hero.addEventListener('pointerup', () => { if (TOUCH) releasePointer(); }, { passive:true });

  let melt = .72;
  const step = (time, dt) => {
    mouse.x += (mouse.tx - mouse.x) * follow(8.5, dt);
    mouse.y += (mouse.ty - mouse.y) * follow(8.5, dt);
    mouse.vx += (mouse.tvx - mouse.vx) * follow(12.0, dt);
    mouse.vy += (mouse.tvy - mouse.vy) * follow(12.0, dt);
    mouse.tvx *= Math.exp(-8.5*dt); mouse.tvy *= Math.exp(-8.5*dt);
    mouse.power += ((mouse.on ? 1 : 0) - mouse.power) * follow(mouse.on ? 5.5 : 2.0, dt);
    const pointerSpeed = clamp(Math.hypot(mouse.vx,mouse.vy)*.72, 0, 1);
    const targetEnergy = mouse.on ? pointerSpeed : 0;
    mouse.energy += (targetEnergy - mouse.energy) * follow(targetEnergy > mouse.energy ? 10 : 2.4, dt);

    const rawMorph = .5 - .5 * Math.cos(time * .31);
    const morph = rawMorph * rawMorph * (3 - 2 * rawMorph);
    const driftX = Math.sin(time * .13) * .014 + Math.sin(time * .047 + 1.2) * .006;
    const driftY = Math.cos(time * .11 + .7) * .012 + Math.sin(time * .043) * .005;
    const portraitMix = clamp((cv.clientWidth / Math.max(1, cv.clientHeight)) * 1.7, .42, 1);
    const radiusScale = lerp(1.12, 1, portraitMix);
    let near = 0;

    for (let i = 0; i < N; i++) {
      const p = drops[i], a = FORM_A[i], z = FORM_B[i];
      let tx = lerp(a[0], z[0], morph) + driftX;
      let ty = lerp(a[1], z[1], morph);
      ty = .52 + (ty - .52) * portraitMix + driftY;
      tx += Math.sin(time * (.18 + i*.008) + i*1.71) * (.010 + i*.0012);
      ty += Math.cos(time * (.16 + i*.009) + i*1.37) * (.009 + i*.0010);

      const mdx = mouse.x - tx, mdy = mouse.y - ty;
      const pointerAspect = clamp(cv.clientWidth / Math.max(1, cv.clientHeight), .65, 1.85);
      const md = Math.hypot(mdx * pointerAspect, mdy);
      const response = mouse.power * Math.exp(-md*md/.060);
      const pull = response * (.22 + mouse.energy*.14);
      tx += mdx * pull;
      ty += mdy * pull;
      tx += (mouse.vx - mouse.vy*.28) * response * mouse.energy * .018;
      ty += (mouse.vy + mouse.vx*.28) * response * mouse.energy * .018;

      const moveRate = 2.15 + mouse.energy * 1.70;
      p.x += (tx - p.x) * follow(moveRate, dt);
      p.y += (ty - p.y) * follow(moveRate, dt);

      const breathe = Math.sin(time*.34 + i*.91) * .025
                    + Math.sin(time*.15 - i*1.47) * .010;
      const splitBreath = 1 - morph * (i === 0 ? .025 : .045);
      const targetRadius = p.r * radiusScale * splitBreath * (1 + breathe + response*(.065 + mouse.energy*.045));
      p.cr += (targetRadius - p.cr) * follow(3.0, dt);
    }

    for (let i = 0; i < N; i++) {
      const p = drops[i];
      for (let j = i + 1; j < N; j++) {
        const q = drops[j];
        const d = Math.hypot(p.x-q.x,p.y-q.y);
        const sum = p.cr + q.cr;
        near = Math.max(near, clamp(1 - (d-sum*.62)/(sum*.74), 0, 1));
      }
      data[i*3] = p.x; data[i*3+1] = p.y; data[i*3+2] = p.cr;
    }
    const targetMelt = clamp(.64 + near*.24 + mouse.energy*.12, 0, 1);
    melt += (targetMelt - melt) * follow(targetMelt > melt ? 3.0 : 1.6, dt);
  };

  const MAXPX = TOUCH ? 900000 : 1800000;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, TOUCH ? 1.5 : 1.75);
    let w = cv.clientWidth * dpr, h = cv.clientHeight * dpr;
    const k = Math.sqrt(MAXPX / Math.max(1, w * h));
    if (k < 1) { w *= k; h *= k; }
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0,0,w,h); }
  };
  addEventListener('resize', size); size();
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold:0 }).observe(hero);

  const t0 = performance.now();
  let prev = t0;
  (function draw(now){
    requestAnimationFrame(draw);
    const dt = Math.min((now - prev) / 1000, .032);
    prev = now;
    if (!visible || document.hidden) return;
    size();
    const time = (now - t0) / 1000;
    step(time, dt);
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uT, time);
    gl.uniform1f(uM, melt);
    gl.uniform4f(uC, mouse.x, mouse.y, mouse.energy, mouse.power);
    gl.uniform3fv(uB, data);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
  const setStatus = (text, kind = '') => {
    if (!status) return;
    status.textContent = text;
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
    const subject = L('Заявка з сайту — ','Website enquiry — ') + d.name;
    if (!CFG.formEndpoint) {
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    submit.disabled = true;
    setStatus(L('Надсилаємо захищений brief…','Sending your brief…'));
    try {
      const payload = { ...d, message: body, _subject: subject, _template:'table', _url:location.href };
      const r = await fetch(CFG.formEndpoint, {
        method:'POST',
        headers:{Accept:'application/json','Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok || result.success === 'false' || result.success === false) throw new Error('form endpoint rejected request');
      setStatus(L('Дякуємо — заявку надіслано. Відповімо протягом робочого дня.','Thank you — your enquiry was sent. We reply within one business day.'), 'ok');
      flash(L('Заявку надіслано.','Enquiry sent.'));
      f.reset();
    } catch(_) {
      setStatus(L('Не вдалося надіслати автоматично. Напишіть нам на ixonity@gmail.com.','Automatic sending failed. Please email ixonity@gmail.com.'), 'err');
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
  tk3:'Languages <em>UA / EN</em>', tk4:'Contract · invoice <em>· NDA</em>', tk5:'You own <em>the source code</em>',
  from:'from', range:'typical', permo:'/mo',
  eb1:'01 / Services', s_title:'What we build',
  s_lead:'Full cycle: research → design → code → launch → support. You do not assemble a team of freelancers or referee between contractors.',
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
  eb2:'02 / Process', p_title:'How we work',
  p1t:'The call', p1d:'30–40 minutes. We unpack the task, the business goal, the budget. No jargon. Free, no strings attached.', p1x:'Day 0 · free',
  p2t:'Estimate & plan', p2d:'You get a document: what is included, what is not, the cost, the timeline. A fixed price, not a "roughly".', p2x:'1–2 days',
  p3t:'Design', p3d:'Prototype → Figma mockups. You see the product before a single line of code is written. Two rounds of revisions included.', p3x:'5–14 days',
  p4t:'Development', p4d:'We work in sprints. Once a week: a demo and a live link. You always see what you are paying for.', p4x:'2–10 weeks',
  p5t:'Launch', p5d:'Testing, migration to your hosting, store submission, analytics. We hand over every access key and the source code.', p5x:'2–5 days',
  p6t:'Support', p6d:'Six months of free bug fixing. After that — a monthly plan or hourly work, whichever suits you.', p6x:'6-month warranty',
  eb3:'03 / Work', w_title:'Already shipped',
  w_lead:'Real products in production — not Dribbble concepts. Two apps published on the App Store, plus our own R&D engine.',
  c1d:'A full furniture store inside an app: filtered catalogue, cart, orders, Monobank acquiring, behaviour analytics, a manager dashboard. From mockup to App Store release — built from the first line.',
  c2d:'A QR generator at commercial-tool level: custom eyes and frames, branding, dynamic codes, scan statistics, print-quality export.',
  c3d:'Our own planetary 3D engine on WebGPU: volumetric clouds with Rayleigh/Mie scattering, climate simulation over a million particles, seamless LOD. We build it to stay sharp on the hardest graphics.',
  c_open:'View case study', c_follow:'View the R&D case',
  reel_k:'Ixonity / Motion reel 01',
  reel_title:'Research that moves commercial design forward',
  reel_text:'The showreel loads only when it approaches the viewport, keeping the first screen fast.',
  reel_play:'Play', 
  r1:'Fixed price', r2:'Signed contract', r3:'You own the code', r4:'6-month warranty',
  r5:'Weekly demos', r6:'No 100% upfront',
  eb4:'04 / Investment', pr_title:'Clear ranges. No fog.',
  pr_lead:'These are ranges for custom full-cycle delivery, not template packages. After discovery, scope, timeline and price are fixed in the proposal.',
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
  eb5:'05 / Project estimator', cl_title:'Estimate the scope',
  cl_lead:'Not a simple sum of options: product baseline is shaped by design, motion, features and pace. The result is a useful range for the first conversation.',
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
  eb6:'06 / Questions', f_title:'What people ask',
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
  eb7:'07 / Start a project', ct_title:'Let us start',
  ct_lead:'A short brief lets us discuss the solution, timeline and realistic budget immediately. We usually reply within one business day.',
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
