/**
 * THEWRISTCLUB — Home-page "Our Collection" section (Amazon-style shop front).
 * Injects a limited, curated front into index.html — NEVER the full 1,247 cards:
 *   - heading + sub
 *   - shop-by-category tiles (For Him / For Her / Unisex) -> catalog.html?cat=
 *   - Top Brands (up to 12, by largest count) -> catalog.html?brand=
 *   - Featured Watches (horizontal strip, 8 items across a few brands) -> product pages
 *   - "View Full Collection" button -> catalog.html
 * Vanilla JS, idempotent, never throws. Exposes window.__twcCollection.
 * Depends on TWCSHOP (assets/js/twc-shop.js) when present; falls back gracefully.
 */
;(function () {
  'use strict';

  var SECTION_ID = 'twc-collection';
  var state = window.__twcCollection = { injected: false, index: null, failed: false };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function safeImg(img) {
    try {
      img.addEventListener('error', function () {
        try { img.style.display = 'none'; img.parentNode.classList.add('twc-img-missing'); } catch (_e) {}
      });
    } catch (_e) { /* never throw */ }
  }

  /* ---------------- styles ---------------- */

  function buildStyle() {
    var s = el('style');
    s.textContent = [
      '#twc-collection{background:#0d0d0d;color:#fff;padding:80px 24px;font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif}',
      '#twc-collection .twc-col-inner{max-width:1216px;margin:0 auto}',
      '#twc-collection .twc-col-overline{text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:10px}',
      '#twc-collection h2{text-align:center;font-size:40px;margin:0 0 8px;font-weight:600;letter-spacing:-0.02em}',
      '#twc-collection .twc-col-sub{text-align:center;color:rgba(255,255,255,.6);font-size:15px;margin:0 0 40px}',
      '#twc-collection .twc-col-rowtitle{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#eaeaea;font-weight:600;margin:44px 0 16px;text-align:left}',
      '#twc-collection .twc-col-rowtitle:first-of-type{margin-top:0}',

      /* category tiles */
      '#twc-collection .twc-col-cats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}',
      '#twc-collection .twc-col-cat{position:relative;display:block;aspect-ratio:16/10;border-radius:18px;overflow:hidden;text-decoration:none;border:1px solid rgba(255,255,255,.08);transition:border-color .3s ease,transform .3s ease}',
      '#twc-collection .twc-col-cat:hover{border-color:rgba(255,255,255,.55);transform:translateY(-3px)}',
      '#twc-collection .twc-col-cat img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.5) saturate(.9);transition:transform .5s ease,filter .4s ease}',
      '#twc-collection .twc-col-cat:hover img{transform:scale(1.05);filter:brightness(.62) saturate(1)}',
      '#twc-collection .twc-col-cat-label{position:absolute;left:0;right:0;bottom:0;padding:18px 20px;z-index:1}',
      '#twc-collection .twc-col-cat-name{font-size:19px;font-weight:600;color:#fff}',
      '#twc-collection .twc-col-cat-n{font-size:12.5px;color:rgba(255,255,255,.65);margin-top:2px}',
      '#twc-collection .twc-col-cat:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,13,0) 40%,rgba(13,13,13,.85) 100%)}',
      '#twc-collection .twc-col-cat-label,#twc-collection .twc-col-cat img{z-index:0}',

      /* brand tiles */
      '#twc-collection .twc-col-brands{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}',
      '#twc-collection .twc-col-brandtile{position:relative;display:block;aspect-ratio:1/1;border-radius:16px;overflow:hidden;text-decoration:none;border:1px solid rgba(255,255,255,.08);transition:border-color .3s ease,transform .3s ease}',
      '#twc-collection .twc-col-brandtile:hover{border-color:rgba(255,255,255,.55);transform:translateY(-3px)}',
      '#twc-collection .twc-col-brandtile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.48) saturate(.9);transition:transform .5s ease}',
      '#twc-collection .twc-col-brandtile:hover img{transform:scale(1.06)}',
      '#twc-collection .twc-col-brandtile:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,13,.05) 35%,rgba(13,13,13,.85) 100%)}',
      '#twc-collection .twc-col-brandtile-label{position:absolute;left:0;right:0;bottom:0;padding:12px 14px;z-index:1}',
      '#twc-collection .twc-col-brandtile-name{font-size:13.5px;font-weight:600;color:#fff;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '#twc-collection .twc-col-brandtile-n{font-size:11.5px;color:rgba(255,255,255,.6);margin-top:2px}',

      /* featured strip */
      '#twc-collection .twc-col-strip{display:grid;grid-auto-flow:column;grid-auto-columns:200px;gap:14px;overflow-x:auto;padding-bottom:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}',
      '#twc-collection .twc-col-strip::-webkit-scrollbar{height:6px}',
      '#twc-collection .twc-col-strip::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:99px}',

      /* CTA */
      '#twc-collection .twc-col-cta{all:unset;cursor:pointer;display:block;margin:40px auto 0;padding:15px 38px;border-radius:999px;background:#fff;color:#0d0d0d;font-weight:600;font-size:15px;text-align:center;transition:all .25s ease}',
      '#twc-collection .twc-col-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}',

      '@media(max-width:640px){',
      '  #twc-collection h2{font-size:28px}',
      '  #twc-collection .twc-col-cats{grid-template-columns:1fr;gap:12px}',
      '  #twc-collection .twc-col-brands{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}',
      '  #twc-collection .twc-col-strip{grid-auto-columns:160px;gap:10px}',
      '}'
    ].join('\n');
    return s;
  }

  /* ---------------- section builders ---------------- */

  function heading(inner) {
    inner.appendChild(el('div', 'twc-col-overline', 'THE WRIST CLUB'));
    inner.appendChild(el('h2', null, 'Our Collection'));
    inner.appendChild(el('p', 'twc-col-sub', '1,200+ premium watches across 50+ brands — photographed in-house.'));
  }

  function categoryTiles(inner, index) {
    try {
      var cats = [
        { key: 'him', label: 'For Him' },
        { key: 'her', label: 'For Her' },
        { key: 'unisex', label: 'Unisex' }
      ];
      var row = el('div', 'twc-col-cats');
      var made = 0;
      cats.forEach(function (c) {
        /* cover = cover of the first brand of that category in the index */
        var first = null, count = 0;
        (index || []).forEach(function (b) {
          if (b.category === c.key) { if (!first) first = b; count += (typeof b.count === 'number' && b.count > 0) ? b.count : 0; }
        });
        if (!first) return; /* category empty in data — skip defensively */
        var a = el('a', 'twc-col-cat');
        a.href = 'catalog.html?cat=' + c.key;
        if (first.cover) {
          var img = document.createElement('img');
          img.loading = 'lazy'; img.decoding = 'async'; img.alt = c.label + ' watches';
          safeImg(img); img.src = first.coverThumb || first.cover;
          a.appendChild(img);
        } else { a.classList.add('twc-img-missing'); }
        var label = el('div', 'twc-col-cat-label');
        label.appendChild(el('div', 'twc-col-cat-name', c.label));
        label.appendChild(el('div', 'twc-col-cat-n', count + (count === 1 ? ' watch' : ' watches')));
        a.appendChild(label);
        row.appendChild(a);
        made++;
      });
      if (!made) return;
      inner.appendChild(el('div', 'twc-col-rowtitle', 'Shop by Category'));
      inner.appendChild(row);
    } catch (_e) { /* never throw */ }
  }

  function brandTiles(inner, index) {
    try {
      var brands = (index || []).slice()
        .sort(function (a, b) { return (b.count || 0) - (a.count || 0); })
        .slice(0, 12);
      if (!brands.length) return;
      var row = el('div', 'twc-col-brands');
      brands.forEach(function (b) {
        var a = el('a', 'twc-col-brandtile');
        a.href = 'catalog.html?brand=' + encodeURIComponent(b.brandKey);
        if (b.cover) {
          var img = document.createElement('img');
          img.loading = 'lazy'; img.decoding = 'async'; img.alt = b.brand + ' watches';
          safeImg(img); img.src = b.coverThumb || b.cover;
          a.appendChild(img);
        } else { a.classList.add('twc-img-missing'); }
        var label = el('div', 'twc-col-brandtile-label');
        label.appendChild(el('div', 'twc-col-brandtile-name', b.brand || b.brandKey));
        label.appendChild(el('div', 'twc-col-brandtile-n', (typeof b.count === 'number' ? b.count : '') + ' watches'));
        a.appendChild(label);
        row.appendChild(a);
      });
      inner.appendChild(el('div', 'twc-col-rowtitle', 'Top Brands'));
      inner.appendChild(row);
    } catch (_e) { /* never throw */ }
  }

  /* Featured strip: first 8 items across a few brands (lazy: only those files). */
  function featuredStrip(inner, index) {
    try {
      var wanted = [];
      var picks = (index || []).filter(function (b) { return b && b.brandKey && (b.count || 0) > 0; }).slice(0, 4);
      picks.forEach(function (b) {
        var n = Math.min(2, b.count || 1);
        for (var i = 1; i <= n; i++) wanted.push({ brandKey: b.brandKey, n: i, brandName: b.brand || '' });
      });
      wanted = wanted.slice(0, 8);
      if (!wanted.length) return;

      var data = {};  /* brandKey -> brand file data */
      var row = el('div', 'twc-col-strip');
      inner.appendChild(el('div', 'twc-col-rowtitle', 'Featured Watches'));
      inner.appendChild(row);

      /* placeholders first, then real cards once the few brand files land */
      var byBrand = {};
      wanted.forEach(function (r) { (byBrand[r.brandKey] = byBrand[r.brandKey] || []).push(r); });
      var keys = Object.keys(byBrand);
      Promise.all(keys.map(function (k) {
        return window.TWCSHOP.loadBrand(k).then(function (d) {
          data[k] = d; return d;
        }).catch(function () { return null; });
      })).then(function () {
        try {
          row.innerHTML = '';
          wanted.forEach(function (r) {
            var d = data[r.brandKey];
            var brandEntry = d || { brand: r.brandName, brandKey: r.brandKey, items: [] };
            var item = d && d.items && d.items[r.n - 1];
            if (item) row.appendChild(window.TWCSHOP.renderCard(item, brandEntry, r.n));
          });
        } catch (_e) { /* never throw */ }
      });
    } catch (_e) { /* never throw */ }
  }

  /* ---------------- build + inject ---------------- */

  function build() {
    var section = el('section');
    section.id = SECTION_ID;
    section.appendChild(buildStyle());
    var inner = el('div', 'twc-col-inner');
    heading(inner);
    section.appendChild(inner);
    return section;
  }

  function fill(inner, index) {
    try {
      categoryTiles(inner, index);
      brandTiles(inner, index);
      if (window.TWCSHOP) featuredStrip(inner, index);
      var cta = el('a', 'twc-col-cta', 'View Full Collection \u2192');
      cta.href = 'catalog.html';
      inner.appendChild(cta);
    } catch (_e) { /* never throw */ }
  }

  function inject(index) {
    try {
      if (document.getElementById(SECTION_ID)) return;
      var main = document.getElementById('main');
      if (!main) return;
      var section = build();
      /* place: right after the "Catlogue" template section (which we hide) */
      var anchor = document.querySelector('[data-framer-name="Catlogue"]');
      if (anchor) {
        anchor.parentNode.insertBefore(section, anchor.nextSibling);
        anchor.style.display = 'none';
      } else {
        var footer = null;
        var all = document.querySelectorAll('[data-framer-name]');
        for (var i = 0; i < all.length; i++) {
          if ((all[i].getAttribute('data-framer-name') || '') === 'Footer') { footer = all[i]; break; }
        }
        if (footer && footer.parentNode) footer.parentNode.insertBefore(section, footer);
        else return;
      }
      fill(section.querySelector('.twc-col-inner'), index);
      state.injected = true;
      state.index = index;
    } catch (_e) { state.injected = false; }
  }

  function loadIndexFallback() {
    /* defensive fallback if twc-shop.js failed to load */
    return fetch('assets/data/catalog-index.json', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { return Array.isArray(d) ? d : []; })
      .catch(function () { return []; });
  }

  function boot() {
    try {
      if (document.getElementById(SECTION_ID)) return;
      var ready = window.TWCSHOP ? window.TWCSHOP.loadIndex() : loadIndexFallback();
      ready.then(function (index) {
        var tries = 0;
        var t = setInterval(function () {
          tries++;
          if (state.injected || tries > 40) { clearInterval(t); return; }
          if (document.getElementById('main')) { clearInterval(t); inject(index); }
        }, 400);
      }).catch(function () { state.failed = true; });
    } catch (_e) { /* never throw */ }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else window.addEventListener('DOMContentLoaded', boot, false);
  window.setTimeout(function () { if (!document.getElementById(SECTION_ID) && !state.failed) boot(); }, 4000);
})();
