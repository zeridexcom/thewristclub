/* eslint-disable */
/**
 * twc-features.js — "Why Shop With The Wrist Club" section injector
 * Premium editorial zigzag: alternating image panel + feature stack rows.
 * Vanilla JS, dependency-free, idempotent. No external requests.
 * Exposes window.__twcFeatures = { injected: true|false }
 */
(function () {
  'use strict';

  var SECTION_ID = 'twc-features';
  var state = { injected: false };

  function publish() {
    try {
      window.__twcFeatures = { injected: !!state.injected };
    } catch (_e) {
      /* window unavailable — nothing more we can do */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Inline SVG icons (stroke-based, white)                              */
  /* ------------------------------------------------------------------ */
  var ICON_ATTRS =
    'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

  var ICONS = {
    gem:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/>' +
      '<path d="M2 9h20"/>' +
      '<path d="M12 3l-3 6 3 12 3-12-3-6z"/>' +
      '</svg>',
    shield:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z"/>' +
      '<path d="M9 12l2 2 4-4"/>' +
      '</svg>',
    badge:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74z"/>' +
      '<path d="M9 12l2 2 4-4"/>' +
      '</svg>',
    truck:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M1 5h13v11H1z"/>' +
      '<path d="M14 9h4l4 4v3h-8"/>' +
      '<circle cx="6" cy="18.5" r="2"/>' +
      '<circle cx="18" cy="18.5" r="2"/>' +
      '</svg>',
    rotate:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M3 12a9 9 0 1 0 3-6.7"/>' +
      '<path d="M3 4v5h5"/>' +
      '<path d="M12 8v4l3 2"/>' +
      '</svg>',
    headset:
      '<svg ' + ICON_ATTRS + '>' +
      '<path d="M4 13a8 8 0 0 1 16 0"/>' +
      '<path d="M3 15a2 2 0 0 1 2-2h1v6H5a2 2 0 0 1-2-2v-2z"/>' +
      '<path d="M21 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z"/>' +
      '<path d="M19 18v1a3 3 0 0 1-3 3h-3"/>' +
      '</svg>'
  };

  /* Three editorial rows; each pairs one image with two features. */
  var ROWS = [
    {
      img: 'assets/collection-thumbs/hublot-fibre/017f5830-a580-4404-8d80-fb702b6e9bee.JPG.jpg',
      items: [
        {
          icon: 'gem',
          title: 'Master-Quality Craftsmanship',
          text: 'Hand-picked for precision finishing and flawless detailing that rivals the original design.'
        },
        {
          icon: 'shield',
          title: 'Built to Last',
          text: 'Scratch-resistant sapphire glass, solid stainless builds and movements made to run for decades.'
        }
      ]
    },
    {
      img: 'assets/collection-thumbs/rx/IMG-20231201-WA0004.jpg.jpg',
      items: [
        {
          icon: 'badge',
          title: '100% Authentic Timepieces',
          text: 'Every watch is verified and quality-checked by our experts before it ever ships to you.'
        },
        {
          icon: 'truck',
          title: 'Secure & Insured Shipping',
          text: 'Fully insured, trackable delivery across India — packed to survive the journey.'
        }
      ]
    },
    {
      img: 'assets/collection-thumbs/audemars-piguet-ap/BDDC764F-80B5-4CEC-A8D6-EBF1E0EA6BBF.jpeg.jpg',
      items: [
        {
          icon: 'rotate',
          title: 'Easy 7-Day Returns',
          text: 'Changed your mind? No-questions-asked returns within 7 days of delivery.'
        },
        {
          icon: 'headset',
          title: 'Expert Watch Support',
          text: 'Real watch specialists on WhatsApp and email to help you choose, service, or maintain.'
        }
      ]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Styles — scoped by #twc-features                                    */
  /* ------------------------------------------------------------------ */
  var CSS = [
    '#twc-features{width:100%;background:radial-gradient(1400px 720px at 50% -140px,rgba(255,255,255,.05),transparent 65%),#0d0d0d;color:#fff;font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif;padding:110px 24px 120px;box-sizing:border-box;}',
    '#twc-features *,#twc-features *::before,#twc-features *::after{box-sizing:border-box;}',
    '#twc-features .twc-features-inner{width:100%;max-width:1120px;margin:0 auto;}',

    /* heading */
    '#twc-features .twc-features-head{text-align:center;margin-bottom:76px;}',
    '#twc-features .twc-features-overline{display:inline-block;font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:4px;color:rgba(255,255,255,.5);margin:0 0 20px;}',
    '#twc-features .twc-features-heading{font-size:clamp(36px,5.5vw,64px);line-height:1.06;font-weight:300;color:#fff;margin:0 0 16px;letter-spacing:-0.03em;}',
    '#twc-features .twc-features-heading b{font-weight:600;}',
    '#twc-features .twc-features-subline{font-size:16px;line-height:1.6;color:rgba(255,255,255,0.55);margin:0 auto;max-width:520px;}',

    /* zigzag rows */
    '#twc-features .twc-row{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:64px;align-items:center;}',
    '#twc-features .twc-row + .twc-row{margin-top:72px;}',
    '#twc-features .twc-row.twc-flip .twc-row-img{order:2;}',
    '#twc-features .twc-row.twc-flip .twc-row-copy{order:1;}',

    /* image panel */
    '#twc-features .twc-row-img{position:relative;aspect-ratio:4/5;border-radius:24px;overflow:hidden;background:#101010;border:1px solid rgba(255,255,255,.08);}',
    '#twc-features .twc-row-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.95) saturate(.96);transition:transform .8s cubic-bezier(.22,.61,.36,1);}',
    '#twc-features .twc-row:hover .twc-row-img img{transform:scale(1.045);}',
    '#twc-features .twc-row-img::after{content:"";position:absolute;inset:0;background:linear-gradient(200deg,rgba(13,13,13,0) 60%,rgba(13,13,13,.5) 100%);}',

    /* copy column */
    '#twc-features .twc-row-copy{display:flex;flex-direction:column;gap:0;}',
    '#twc-features .twc-feat{padding:26px 0;}',
    '#twc-features .twc-feat + .twc-feat{border-top:1px solid rgba(255,255,255,.09);}',
    '#twc-features .twc-feat-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#fff;margin:0 0 14px;}',
    '#twc-features .twc-feat-icon svg{width:18px;height:18px;display:block;}',
    '#twc-features .twc-feat-title{font-size:19px;font-weight:600;color:#fff;margin:0 0 8px;line-height:1.3;letter-spacing:-0.01em;}',
    '#twc-features .twc-feat-text{font-size:14.5px;line-height:1.7;color:rgba(255,255,255,.55);margin:0;max-width:420px;}',

    /* number detail on image */
    '#twc-features .twc-row-num{position:absolute;left:22px;bottom:18px;z-index:1;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.75);font-weight:600;}',

    /* staggered rise */
    '@keyframes twcFtrIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}',
    '#twc-features .twc-row{animation:twcFtrIn .7s cubic-bezier(.22,.61,.36,1) backwards;}',

    /* scroll reveal */
    '#twc-features.twc-reveal{opacity:0;transform:translateY(16px);}',
    '#twc-features.twc-reveal.twc-reveal-in{opacity:1;transform:translateY(0);transition:opacity 0.6s ease,transform 0.6s ease;}',

    /* responsive */
    '@media (max-width:900px){',
    '  #twc-features{padding:80px 20px 90px;}',
    '  #twc-features .twc-row{grid-template-columns:1fr;gap:26px;}',
    '  #twc-features .twc-row.twc-flip .twc-row-img{order:1;}',
    '  #twc-features .twc-row.twc-flip .twc-row-copy{order:2;}',
    '  #twc-features .twc-row-img{aspect-ratio:16/11;}',
    '  #twc-features .twc-row + .twc-row{margin-top:52px;}',
    '}',
    '@media (max-width:639px){',
    '  #twc-features{padding:64px 16px 72px;}',
    '  #twc-features .twc-features-head{margin-bottom:52px;}',
    '  #twc-features .twc-feat-text{max-width:none;}',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function findFooter() {
    var body = document.body;
    if (!body) return null;
    var re = /\u00a9|copyright|all rights reserved/i;
    var children = body.children;
    for (var i = children.length - 1; i >= 0; i--) {
      var node = children[i];
      try {
        var text = node.textContent || '';
        if (re.test(text)) return node;
      } catch (_e) {
        continue;
      }
    }
    return null;
  }

  function buildSection() {
    var section = el('section', null, null);
    section.id = SECTION_ID;

    var inner = el('div', 'twc-features-inner');

    var head = el('div', 'twc-features-head');
    head.appendChild(el('p', 'twc-features-overline', 'THE WRIST CLUB'));
    var heading = el('h2', 'twc-features-heading', null);
    try {
      heading.innerHTML = 'Why shop with <b>The Wrist Club</b>';
    } catch (_e) {
      heading.textContent = 'Why Shop With The Wrist Club';
    }
    head.appendChild(heading);
    head.appendChild(el(
      'p',
      'twc-features-subline',
      'An online-only store built for watch lovers \u2014 premium quality, zero compromises.'
    ));
    inner.appendChild(head);

    /* zigzag rows */
    for (var r = 0; r < ROWS.length; r++) {
      var row = el('div', 'twc-row' + (r % 2 === 1 ? ' twc-flip' : ''));
      row.style.animationDelay = (r * 120) + 'ms';

      var imgWrap = el('div', 'twc-row-img');
      var img = el('img', null, null);
      img.src = ROWS[r].img;
      img.alt = 'The Wrist Club — quality promise';
      img.loading = 'lazy';
      imgWrap.appendChild(img);
      var num = el('div', 'twc-row-num', '0' + (r + 1) + ' — The Wrist Club standard');
      imgWrap.appendChild(num);
      row.appendChild(imgWrap);

      var copy = el('div', 'twc-row-copy');
      for (var c = 0; c < ROWS[r].items.length; c++) {
        var it = ROWS[r].items[c];
        var feat = el('div', 'twc-feat');
        var iconWrap = el('div', 'twc-feat-icon');
        try {
          iconWrap.innerHTML = ICONS[it.icon] || '';
        } catch (_e) { /* leave icon empty rather than fail */ }
        feat.appendChild(iconWrap);
        feat.appendChild(el('h3', 'twc-feat-title', it.title));
        feat.appendChild(el('p', 'twc-feat-text', it.text));
        copy.appendChild(feat);
      }
      row.appendChild(copy);

      inner.appendChild(row);
    }

    section.appendChild(inner);

    var style = document.createElement('style');
    style.textContent = CSS;
    section.insertBefore(style, section.firstChild);

    return section;
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */
  function setupReveal(section) {
    try {
      var reduced = false;
      try {
        reduced =
          window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (_e) {
        reduced = false;
      }
      if (reduced || typeof IntersectionObserver === 'undefined') {
        section.classList.remove('twc-reveal');
        section.classList.remove('twc-reveal-in');
        return;
      }
      section.classList.add('twc-reveal');
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              section.classList.add('twc-reveal-in');
              try {
                io.disconnect();
              } catch (_e2) {
                /* ignore */
              }
              break;
            }
          }
        },
        { threshold: 0.1 }
      );
      io.observe(section);
    } catch (_e3) {
      try {
        section.classList.remove('twc-reveal');
      } catch (_e4) {
        /* ignore */
      }
    }
  }

  function findAnchor() {
    try {
      var main = document.getElementById('main');
      if (!main) return null;
      /* the React root's real site wrapper is a <div> child of #main;
       * walking further up would reach the wrapper itself (the whole site). */
      var siteRoot = null;
      for (var c = main.firstElementChild; c; c = c.nextElementSibling) {
        if (c.tagName === 'DIV') { siteRoot = c; break; }
      }
      if (!siteRoot) return null;
      /* all page sections (header, content, footer) live inside the page
       * container "landing page"; the footer is its direct child. */
      var pageEl = siteRoot.querySelector(':scope > [data-framer-name="landing page"]');
      if (!pageEl) {
        for (c = siteRoot.firstElementChild; c; c = c.nextElementSibling) {
          if (c.tagName === 'DIV' && (c.textContent || '').length > 1000) { pageEl = c; break; }
        }
      }
      if (!pageEl) return null;
      var all = pageEl.querySelectorAll('*');
      for (var i = all.length - 1; i >= 0; i--) {
        var txt = (all[i].textContent || '').trim();
        if (/©|copyright|all rights reserved/i.test(txt)) {
          var n = all[i];
          while (n.parentElement && n.parentElement !== pageEl) n = n.parentElement;
          return n;
        }
      }
    } catch (_e) { /* never throw */ }
    return null;
  }

  function inject() {
    try {
      if (document.getElementById(SECTION_ID)) return; /* idempotent */
      if (!document.body) return;

      var main = document.getElementById('main');
      var anchor = findAnchor();
      var section = buildSection();
      if (!section) return;

      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(section, anchor);
      } else if (main && main.lastElementChild) {
        main.insertBefore(section, main.lastElementChild);
      } else if (main) {
        main.appendChild(section);
      } else {
        document.body.appendChild(section); /* last resort */
      }

      setupReveal(section);
      state.injected = true;
    } catch (_e2) {
      state.injected = false;
    } finally {
      publish();
    }
  }

  /* Keeper: React may wipe or unmount the node when it re-renders the
   * app subtree. Re-insert if the section leaves the document. */
  function keepAlive() {
    try {
      var section = document.getElementById(SECTION_ID);
      if (!section) {
        var main = document.getElementById('main');
        if (main && window.__twcFeatures && window.__twcFeatures.everInjected) {
          var anchor = findAnchor();
          var fresh = buildSection();
          if (fresh) {
            if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(fresh, anchor);
            else if (main.lastElementChild) main.insertBefore(fresh, main.lastElementChild);
            else main.appendChild(fresh);
            setupReveal(fresh);
            state.reinjected = (state.reinjected || 0) + 1;
          }
        }
        return;
      }
      /* also re-position if React moved the footer below us */
      var anchor2 = findAnchor();
      if (anchor2 && anchor2.previousElementSibling !== section) {
        anchor2.parentNode.insertBefore(section, anchor2);
      }
    } catch (_e3) { /* never throw */ }
  }

  /* ------------------------------------------------------------------ */
  /* Boot: full load (Framer app div mounts late) + 600ms settle         */
  /* ------------------------------------------------------------------ */
  function boot() {
    try {
      window.setTimeout(function () {
        inject();
        if (state.injected) window.__twcFeatures.everInjected = true;
        /* start the self-healing keeper */
        setInterval(keepAlive, 2000);
      }, 600);
    } catch (_e) {
      publish();
    }
  }

  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot, false);
    /* safety: if 'load' already passed, boot on a timer */
    window.setTimeout(function () {
      if (!document.getElementById(SECTION_ID)) boot();
    }, 3000);
  }

  publish();
})();
