/*
 * THEWRISTCLUB — twc-order.js
 * WhatsApp-first "checkout": a 20-second order form modal that composes a structured
 * WhatsApp message (product, link, customer details) — no cart, no backend, no hassle.
 *
 * API:
 *   TWCORDER.open({ name, brand, images, url })   — open the order modal for a product
 *   TWCORDER.wa(product, extra)                    — direct wa.me link (cards use this)
 */
(function () {
  'use strict';
  var WA = window.TWC_WA || '919000000000';

  /* ---------------- styles ---------------- */
  var style = document.createElement('style');
  style.id = 'twc-order-styles';
  style.textContent = [
    '.twc-modal-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:twcFadeIn .25s ease both}',
    '.twc-modal{width:100%;max-width:430px;background:#111;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:26px 26px 22px;font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif;color:#fff;position:relative;max-height:90vh;overflow:auto;animation:twcPop .3s cubic-bezier(.22,.61,.36,1) both}',
    '.twc-modal h3{font-size:19px;font-weight:600;margin:0 0 4px;letter-spacing:-.01em}',
    '.twc-modal .twc-m-sub{font-size:13px;color:rgba(255,255,255,.55);margin:0 0 18px}',
    '.twc-modal .twc-m-product{display:flex;gap:12px;align-items:center;background:#161616;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:10px 12px;margin-bottom:18px}',
    '.twc-modal .twc-m-product img{width:52px;height:52px;border-radius:10px;object-fit:cover}',
    '.twc-modal .twc-m-product .t1{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:3px}',
    '.twc-modal .twc-m-product .t2{font-size:13.5px;font-weight:500;line-height:1.35}',
    '.twc-modal label{display:block;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 6px}',
    '.twc-modal input,.twc-modal textarea{width:100%;box-sizing:border-box;background:#161616;border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;padding:11px 14px;margin:0 0 14px;outline:none;transition:border-color .2s ease;resize:none}',
    '.twc-modal input:focus,.twc-modal textarea:focus{border-color:rgba(255,255,255,.45)}',
    '.twc-modal input::placeholder,.twc-modal textarea::placeholder{color:rgba(255,255,255,.3)}',
    '.twc-modal .twc-m-send{all:unset;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;box-sizing:border-box;padding:14px 20px;border-radius:999px;background:#fff;color:#0d0d0d;font-weight:600;font-size:14.5px;transition:transform .25s ease,box-shadow .25s ease}',
    '.twc-modal .twc-m-send:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(0,0,0,.5)}',
    '.twc-modal .twc-m-send svg{width:18px;height:18px}',
    '.twc-modal .twc-m-close{all:unset;cursor:pointer;position:absolute;top:16px;right:18px;color:rgba(255,255,255,.5);font-size:20px;line-height:1;padding:4px}',
    '.twc-modal .twc-m-close:hover{color:#fff}',
    '.twc-modal .twc-m-note{text-align:center;font-size:11.5px;color:rgba(255,255,255,.4);margin:12px 0 0}',
    '@keyframes twcFadeIn{from{opacity:0}to{opacity:1}}',
    '@keyframes twcPop{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}'
  ].join('\n');
  document.head.appendChild(style);

  var WA_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.77 14.06c-.24.68-1.4 1.3-1.93 1.35-.5.04-.98.23-2.72-.57a10.4 10.4 0 0 1-4.24-3.72c-1.1-1.63-1.14-2.97-.85-3.6.28-.62 1.06-1.4 1.28-1.62.22-.23.48-.28.64-.28h.46c.15 0 .35-.05.55.42.2.48.7 1.7.76 1.82.06.13.1.28.02.45-.09.17-.5.75-.68.97-.13.16-.27.34-.12.6.15.27.68 1.12 1.46 1.8.99.88 1.68 1.13 1.95 1.26.27.13.43.11.6-.07.17-.2.72-.85.91-1.14.19-.28.39-.23.65-.14.27.1 1.7.8 2 .95.3.15.48.22.55.34.07.12.07.7-.17 1.38Z" fill="#0d0d0d"/></svg>';

  function composeMessage(p, f) {
    var lines = [
      'Hi The Wrist Club! I\u2019d like to order this piece:',
      '\u2022 Watch: ' + (p.name || 'Timepiece'),
      '\u2022 Brand: ' + (p.brand || ''),
      '\u2022 Link: ' + (p.url || location.href)
    ];
    if (f.name) lines.push('\u2022 My name: ' + f.name);
    if (f.city) lines.push('\u2022 City: ' + f.city);
    if (f.phone) lines.push('\u2022 WhatsApp: ' + f.phone);
    if (f.note) lines.push('\u2022 Note: ' + f.note);
    lines.push('\u2014 sent from thewristclub.in');
    return lines.join('\n');
  }

  function open(product) {
    try {
      if (document.getElementById('twc-order-backdrop')) return;
      var p = product || {};
      var bd = document.createElement('div');
      bd.id = 'twc-order-backdrop';
      bd.className = 'twc-modal-backdrop';
      bd.innerHTML =
        '<div class="twc-modal" role="dialog" aria-modal="true">' +
        '  <button class="twc-m-close" aria-label="Close">\u00D7</button>' +
        '  <h3>Order via WhatsApp</h3>' +
        '  <p class="twc-m-sub">Takes 20 seconds \u2014 we confirm availability, best price & delivery on chat.</p>' +
        '  <div class="twc-m-product">' +
        '    <img alt="">' +
        '    <div><div class="t1"></div><div class="t2"></div></div>' +
        '  </div>' +
        '  <label for="twc-o-name">Your name</label>' +
        '  <input id="twc-o-name" placeholder="e.g. Arjun" autocomplete="name">' +
        '  <label for="twc-o-city">City</label>' +
        '  <input id="twc-o-city" placeholder="e.g. Bangalore" autocomplete="address-level2">' +
        '  <label for="twc-o-note">Note (optional)</label>' +
        '  <textarea id="twc-o-note" rows="2" placeholder="e.g. gift \u2014 please remove price tag"></textarea>' +
        '  <button class="twc-m-send">' + WA_ICON + ' Send Order on WhatsApp</button>' +
        '  <p class="twc-m-note">We usually reply within minutes \u2022 No advance payment needed to enquire</p>' +
        '</div>';
      document.body.appendChild(bd);
      var img = bd.querySelector('.twc-m-product img');
      if (p.thumb || (p.images && p.images[0])) img.src = p.thumb || p.images[0];
      bd.querySelector('.t1').textContent = (p.brand || 'The Wrist Club');
      bd.querySelector('.t2').textContent = (p.name || 'Timepiece');

      var close = function () { bd.remove(); };
      bd.addEventListener('click', function (ev) { if (ev.target === bd) close(); });
      bd.querySelector('.twc-m-close').addEventListener('click', close);
      document.addEventListener('keydown', function onKey(ev) {
        if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
      });
      bd.querySelector('.twc-m-send').addEventListener('click', function () {
        var f = {
          name: (bd.querySelector('#twc-o-name').value || '').trim(),
          city: (bd.querySelector('#twc-o-city').value || '').trim(),
          note: (bd.querySelector('#twc-o-note').value || '').trim()
        };
        var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(composeMessage(p, f));
        window.open(url, '_blank', 'noopener');
        close();
      });
      bd.querySelector('#twc-o-name').focus();
    } catch (_e) {}
  }

  /* direct deep link for cards (no modal — zero hassle) */
  function wa(product, extra) {
    var p = product || {};
    var lines = ['Hi The Wrist Club! I\u2019m interested in: ' + (p.name || 'a timepiece') + ' (' + (p.brand || '') + ')'];
    if (p.id) lines.push('Product code: ' + p.id);
    if (extra) lines.push(extra);
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  window.TWCORDER = { open: open, wa: wa };
})();
