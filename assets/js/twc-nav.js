/*
 * THEWRISTCLUB — twc-nav.js
 * Makes the template top-bar navigate (the Framer export ships nav items as plain text),
 * replaces the dead cart/profile icon cluster with a WhatsApp button, and adds a
 * floating WhatsApp bubble on every page.
 */
(function () {
  'use strict';
  var WA = (window.TWC_WA = window.TWC_WA || '919000000000');
  var waLink = function (text) {
    return 'https://wa.me/' + WA + (text ? '?text=' + encodeURIComponent(text) : '');
  };

  /* ---------------- styles ---------------- */
  var style = document.createElement('style');
  style.id = 'twc-nav-styles';
  style.textContent = [
    '[data-framer-name="Header"] [data-framer-name="THEWRISTCLUB"],',
    '[data-framer-name="Header"] [data-framer-name="Home"],',
    '[data-framer-name="Header"] [data-framer-name="Timepieces"],',
    '[data-framer-name="Header"] [data-framer-name="Features"],',
    '[data-framer-name="Header"] [data-framer-name="About us"]{cursor:pointer!important}',
    /* the caret arrows suggest dropdowns that don't exist — hide them */
    '[data-framer-name="Header"] [data-framer-name*="arrow_drop_down"]{display:none!important}',
    /* dead cart/profile icon cluster */
    '[data-framer-name="Header"] .framer-opp9ty{display:none!important}',
    /* gold Rolex crown -> white to match the black & white theme */
    'img[src*="yxEZLAgenGdUQ505LW0bjd3A3E"]{filter:brightness(0) invert(1)!important}',
    /* our replacement cluster */
    '.twc-nav-actions{display:flex;align-items:center;gap:10px}',
    '.twc-wa-btn{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:999px;background:#fff;border:none;cursor:pointer;transition:transform .25s ease,box-shadow .25s ease;text-decoration:none}',
    '.twc-wa-btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(0,0,0,.45)}',
    '.twc-wa-btn svg{width:19px;height:19px;display:block}',
    /* floating bubble */
    '#twc-wa-float{position:fixed;right:22px;bottom:22px;z-index:9998;display:flex;align-items:center;gap:10px;text-decoration:none;background:#fff;color:#0d0d0d;border-radius:999px;padding:12px 20px 12px 16px;font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif;font-size:14px;font-weight:600;box-shadow:0 14px 34px rgba(0,0,0,.5);transition:transform .25s ease,box-shadow .25s ease}',
    '#twc-wa-float:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(0,0,0,.55)}',
    '#twc-wa-float svg{width:20px;height:20px}',
    '@media(max-width:640px){#twc-wa-float span{display:none}#twc-wa-float{padding:14px;border-radius:999px}}'
  ].join('\n');
  document.head.appendChild(style);

  var WA_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.77 14.06c-.24.68-1.4 1.3-1.93 1.35-.5.04-.98.23-2.72-.57a10.4 10.4 0 0 1-4.24-3.72c-1.1-1.63-1.14-2.97-.85-3.6.28-.62 1.06-1.4 1.28-1.62.22-.23.48-.28.64-.28h.46c.15 0 .35-.05.55.42.2.48.7 1.7.76 1.82.06.13.1.28.02.45-.09.17-.5.75-.68.97-.13.16-.27.34-.12.6.15.27.68 1.12 1.46 1.8.99.88 1.68 1.13 1.95 1.26.27.13.43.11.6-.07.17-.2.72-.85.91-1.14.19-.28.39-.23.65-.14.27.1 1.7.8 2 .95.3.15.48.22.55.34.07.12.07.7-.17 1.38Z" fill="#0d0d0d"/></svg>';

  /* ---------------- nav click routing (event delegation — survives React re-renders) ---------------- */
  var NAV_MAP = {
    'THEWRISTCLUB': function () { return 'index.html'; },
    'Home': function () { return 'index.html'; },
    'Timepieces': function () { return 'catalog/'; },
    'Features': function () {
      if (location.pathname.endsWith('index.html') || location.pathname === '/') {
        var f = document.getElementById('twc-features');
        if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); return null; }
      }
      return 'index.html#twc-features';
    },
    'About us': function () {
      if (location.pathname.endsWith('index.html') || location.pathname === '/') {
        var f = document.querySelector('[data-framer-name="Footer"]');
        if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); return null; }
      }
      return 'index.html';
    }
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-framer-name="Header"] [data-framer-name]');
    if (!el) return;
    var name = el.getAttribute('data-framer-name');
    var fn = NAV_MAP[name];
    if (!fn) return;
    var href = fn();
    if (href) { ev.preventDefault(); location.href = href; }
  });

  /* ---------------- hero CTAs: Checkout / Buy Now / Explore more / Evaluate ---------------- */
  function featuredProductFrom(node) {
    try {
      var re = /(submariner|datejust|pearlmaster|daytona|yacht-master|gmt|explorer|milgauss|lady-datejust)/i;
      /* climb to the featured-hero container, then find the VISIBLE slide title */
      var n = node;
      var scope = null;
      while (n && n !== document.body) {
        var nm = n.getAttribute && n.getAttribute('data-framer-name');
        if (nm === 'Hero Sections' || nm === 'Hero') { scope = n; break; }
        n = n.parentElement;
      }
      if (!scope) scope = node.closest && node.closest('[data-framer-name="Hero Sections"]') || document.body;
      var cands = scope.querySelectorAll('p.framer-text, span.framer-text');
      var best = null, bestLen = 1e9;
      for (var i = 0; i < cands.length; i++) {
        var c = cands[i];
        if (!(c.offsetWidth && c.offsetHeight)) continue; /* visible only */
        var txt = (c.textContent || '').trim();
        if (re.test(txt) && txt.length < 60 && txt.length < bestLen) { best = txt; bestLen = txt.length; }
      }
      if (best) return { name: best, brand: 'Rolex' };
    } catch (_e) {}
    return { name: 'Featured Timepiece', brand: 'Rolex' };
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest && ev.target.closest('p.framer-text, div, a');
    if (!t) return;
    var txt = (t.textContent || '').trim();
    if (!txt) return;
    var lower = txt.toLowerCase();

    /* checkout / buy now pills in the featured hero -> WhatsApp order modal */
    if (lower === 'checkout' || lower === 'buy now') {
      var a = ev.target.closest && ev.target.closest('a');
      if (a && a.getAttribute('href') === '#') ev.preventDefault();
      ev.preventDefault();
      ev.stopPropagation();
      if (window.TWCORDER) {
        var prod = featuredProductFrom(t);
        window.TWCORDER.open({ name: prod.name, brand: prod.brand, url: 'index.html' });
      } else {
        location.href = 'https://wa.me/' + (window.TWC_WA || '919000000000');
      }
      return;
    }

    /* explore more -> the collection */
    if (lower === 'explore more') {
      ev.preventDefault();
      ev.stopPropagation();
      var col = document.getElementById('twc-collection');
      if (col) col.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else location.href = 'catalog/';
      return;
    }

    /* evaluate my watch -> WhatsApp consult */
    if (lower === 'evaluate my watch') {
      ev.preventDefault();
      ev.stopPropagation();
      location.href = 'https://wa.me/' + (window.TWC_WA || '919000000000') + '?text=' + encodeURIComponent('Hi The Wrist Club! I need help choosing the right watch / getting more details.');
      return;
    }
  }, true);

  /* ---------------- swap the icon cluster for a WhatsApp button ---------------- */
  function ensureActions() {
    try {
      var header = document.querySelector('[data-framer-name="Header"]');
      if (!header || header.querySelector('.twc-nav-actions')) return;
      var dead = header.querySelector('.framer-opp9ty');
      var wrap = document.createElement('div');
      wrap.className = 'twc-nav-actions';
      var a = document.createElement('a');
      a.className = 'twc-wa-btn';
      a.href = waLink('Hi The Wrist Club! I have a question about a watch.');
      a.setAttribute('aria-label', 'Chat on WhatsApp');
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = WA_ICON;
      wrap.appendChild(a);
      if (dead && dead.parentNode) {
        dead.parentNode.insertBefore(wrap, dead);
        dead.style.display = 'none';
      } else {
        header.appendChild(wrap);
      }
    } catch (_e) {}
  }

  /* ---------------- floating WhatsApp bubble ---------------- */
  function ensureFloat() {
    try {
      if (document.getElementById('twc-wa-float')) return;
      var a = document.createElement('a');
      a.id = 'twc-wa-float';
      a.href = waLink('Hi The Wrist Club! I\u2019m browsing the collection and have a question.');
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Order on WhatsApp');
      a.innerHTML = WA_ICON + '<span>Order on WhatsApp</span>';
      document.body.appendChild(a);
    } catch (_e) {}
  }

  function boot() {
    ensureActions();
    ensureFloat();
    /* Framer re-renders can drop the injected cluster — re-check a few times, then via observer */
    var tries = 0;
    var iv = setInterval(function () { ensureActions(); if (++tries > 20) clearInterval(iv); }, 1200);
    try {
      new MutationObserver(function () { ensureActions(); }).observe(document.querySelector('[data-framer-name="Header"]') || document.body, { childList: true, subtree: true });
    } catch (_e) {}
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot, false);
})();
