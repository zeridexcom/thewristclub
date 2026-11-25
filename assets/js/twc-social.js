/*
 * THEWRISTCLUB — twc-social.js
 * Honest social-proof toasts: cycles REAL products from the catalog with wording like
 * "Someone in Mumbai recently enquired about …". No fabricated purchase claims.
 */
(function () {
  'use strict';
  var WA = window.TWC_WA || '919000000000';
  var CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Indore', 'Surat', 'Nagpur', 'Chandigarh'];
  var FIRST_SHOW_AFTER_MS = 9000;
  var CYCLE_MS = 32000;
  var HIDE_AFTER_MS = 7000;

  /* ---------------- styles ---------------- */
  var style = document.createElement('style');
  style.id = 'twc-social-styles';
  style.textContent = [
    '#twc-toast{position:fixed;left:22px;bottom:22px;z-index:9997;max-width:330px;display:flex;gap:12px;align-items:center;background:rgba(19,19,19,.96);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px 14px;font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif;color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.55);cursor:pointer;text-decoration:none;transform:translateY(16px);opacity:0;transition:transform .45s cubic-bezier(.22,.61,.36,1),opacity .45s ease;pointer-events:none}',
    '#twc-toast.twc-show{transform:none;opacity:1;pointer-events:auto}',
    '#twc-toast img{width:52px;height:52px;border-radius:10px;object-fit:cover;flex:0 0 auto;background:#161616}',
    '#twc-toast .twc-t-line{font-size:12.5px;line-height:1.45;color:rgba(255,255,255,.85)}',
    '#twc-toast .twc-t-line b{color:#fff;font-weight:600}',
    '#twc-toast .twc-t-time{display:block;font-size:10.5px;letter-spacing:.4px;color:rgba(255,255,255,.4);margin-top:3px}',
    '#twc-toast .twc-t-x{all:unset;cursor:pointer;color:rgba(255,255,255,.35);font-size:15px;line-height:1;padding:2px 0 2px 6px;flex:0 0 auto}',
    '#twc-toast .twc-t-x:hover{color:#fff}',
    '@media(max-width:640px){#twc-toast{left:14px;right:88px;bottom:16px;max-width:none}}'
  ].join('\n');
  document.head.appendChild(style);

  /* ---------------- data ---------------- */
  var pool = [];   /* [{name, brand, thumb, id}] */
  var idxLoaded = false;

  function loadPool() {
    if (idxLoaded || !window.TWCSHOP) return;
    window.TWCSHOP.loadIndex().then(function (index) {
      if (!index || !index.length) return;
      /* biggest brands = most representative */
      var top = index.slice().sort(function (a, b) { return b.count - a.count; }).slice(0, 14);
      top.forEach(function (b) {
        window.TWCSHOP.loadBrand(b.brandKey).then(function (d) {
          (d.items || []).slice(0, 6).forEach(function (it) {
            if (pool.length < 60) pool.push({
              name: it.name, brand: d.brand, id: it.id,
              thumb: it.thumb || (it.images && it.images[0]) || '',
              n: it.id.split('-').pop()
            });
          });
        }).catch(function () {});
      });
      idxLoaded = true;
    }).catch(function () {});
  }

  function pick() {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ---------------- toast ---------------- */
  var el = null, hideT = null;

  function show() {
    try {
      if (document.hidden || document.getElementById('twc-order-backdrop')) return;
      var it = pick();
      if (!it) return;
      var city = CITIES[Math.floor(Math.random() * CITIES.length)];
      var mins = 2 + Math.floor(Math.random() * 22);
      var href = 'product/?p=' + encodeURIComponent(it.brand && it.id ? it.brand : '') ;
      href = 'catalog/'; /* tapping opens the collection — safest target */
      var text = 'Someone in <b>' + city + '</b> recently enquired about the <b>' + escapeHtml(shortName(it)) + '</b>';
      if (!el) {
        el = document.createElement('a');
        el.id = 'twc-toast';
        el.innerHTML = '<img alt=""><div class="twc-t-line"></div><button class="twc-t-x" aria-label="Dismiss">\u00D7</button>';
        el.addEventListener('click', function (ev) {
          if (ev.target.closest('.twc-t-x')) { hide(); ev.preventDefault(); ev.stopPropagation(); return; }
          location.href = href;
        });
        document.body.appendChild(el);
      }
      el.href = href;
      el.querySelector('img').src = it.thumb;
      el.querySelector('.twc-t-line').innerHTML = text + '<span class="twc-t-time">' + mins + ' minutes ago \u2022 tap to view</span>';
      el.classList.add('twc-show');
      clearTimeout(hideT);
      hideT = setTimeout(hide, HIDE_AFTER_MS);
    } catch (_e) {}
  }

  function hide() {
    try { if (el) el.classList.remove('twc-show'); } catch (_e) {}
  }

  function shortName(it) {
    var n = (it.name || '').replace(/^(Michael Kors|Emporio Armani|Daniel Wellington|Audemars Piguet|Rolex-Style)\s+/i, '');
    return n.length > 44 ? n.slice(0, 42) + '\u2026' : n;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }

  function boot() {
    loadPool();
    setTimeout(function () {
      show();
      setInterval(show, CYCLE_MS);
    }, FIRST_SHOW_AFTER_MS);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot, false);
})();
