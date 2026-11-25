/*
 * twc-resilience.js — animation-reliability patch for the locally exported Framer site.
 *
 * Framer's scroll-reveal animations leave content at opacity: 0 until its runtime
 * observes the element entering the viewport. If the runtime initializes late (or
 * the user scrolls fast), elements get stuck at opacity 0 forever. This patch
 * periodically detects such "stuck" elements (in or above the viewport) and
 * reveals them with a safe inline-style fade. Dependency-free, idempotent,
 * wrapped in try/catch — never throws.
 */
(function () {
  'use strict';

  try {
    // Idempotency guard: never install twice.
    if (window.__twcResilience) return;

    var state = window.__twcResilience = { sweeps: 0, revealed: 0 };

    var SCROLL_DEBOUNCE_MS = 250;
    var scrollTimer = null;

    function isElement(node) {
      return node && node.nodeType === 1;
    }

    // Skip head, templates, SVG internals, and anything under aria-hidden="true".
    function insideAriaHidden(el) {
      var n = el;
      while (n && n !== document.body && n !== document.documentElement) {
        if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return true;
        n = n.parentNode;
      }
      return false;
    }

    function isExcluded(el) {
      if (!el || el === document.head || (document.head && document.head.contains(el))) return true;
      var n = el;
      while (n) {
        var tag = n.tagName;
        if (tag === 'TEMPLATE') return true;
        if (tag && tag.toLowerCase() === 'svg' && n !== el) return true; // SVG internals
        n = n.parentElement;
      }
      return false;
    }

    // An element has visible content if it (or any descendant) carries text,
    // or if it is/contains an <img> or <video>.
    function hasVisibleContent(el) {
      var text = (el.textContent || '').trim();
      if (text.length > 0) return true;
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO') return true;
      return !!(el.querySelector && el.querySelector('img, video'));
    }

    function isPureTranslateY(transformValue) {
      if (!transformValue || transformValue === 'none') return false;
      // Matches translateY(<n>px|%), possibly with whitespace, nothing else.
      if (/^translateY\(\s*[-\d.]+(px|%)\s*\)$/i.test(transformValue)) return true;
      // Matches translate3d where X and Z are 0 and Y is non-zero.
      if (/^translate3d\(\s*0(px)?\s*,\s*[-\d.]+(px|%)\s*,\s*0(px)?\s*\)$/i.test(transformValue)) return true;
      return false;
    }

    function isStuck(el) {
      try {
        var style = window.getComputedStyle(el);
        if (!style) return false;
        // Only touch elements at a computed opacity of exactly 0 — if Framer is
        // animating it toward visible, computed opacity will be > 0.
        if (parseFloat(style.opacity) !== 0) return false;
        var rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false; // skips display:none subtrees
        if (insideAriaHidden(el)) return false;
        if (isExcluded(el)) return false;
        if (!hasVisibleContent(el)) return false;
        return true;
      } catch (e) {
        return false;
      }
    }

    function reveal(el) {
      try {
        var style = window.getComputedStyle(el);
        var transform = style ? style.transform : 'none';
        var needsTransformReset = transform && transform !== 'none' && isPureTranslateY(transform);
        el.style.transition = needsTransformReset
          ? 'opacity 0.6s ease, transform 0.6s ease'
          : 'opacity 0.6s ease';
        if (needsTransformReset) el.style.transform = 'none';
        // Force a style flush so the transition runs from the current state.
        void el.offsetHeight;
        el.style.opacity = '1';
        /*
         * Framer's variant manager gates appear-on-scroll content with
         * `opacity: 0 !important` until it stamps the element with its own
         * completion attribute (data-vm-in). Inline styles can never beat
         * !important, so mirror Framer's OWN unlock mechanism: setting
         * data-vm-in stops the blocking rule from matching and lets the
         * element (and its background-image wrappers) show through.
         */
        if (!el.hasAttribute('data-vm-in')) el.setAttribute('data-vm-in', '');
        state.revealed++;
      } catch (e) { /* never throw */ }
    }

    function sweep() {
      try {
        state.sweeps++;
        var doc = document;
        if (!doc || !doc.body) return;

        var viewportH = window.innerHeight || doc.documentElement.clientHeight || 0;
        var all = doc.body.getElementsByTagName('*');

        /*
         * Position-prune BEFORE any expensive getComputedStyle: skip elements
         * far outside the extended viewport. Deep sections (past the old
         * 500-element cap) were previously never processed at all.
         * Cheap rect test: keep anything overlapping [viewport, viewport+2x]
         * or above it (already scrolled past).
         */
        var margin = viewportH * 2;
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          var tag = el.tagName;
          if (!tag || tag === 'SVG' || tag === 'SCRIPT' || tag === 'STYLE' ||
              tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'HEAD') continue;

          var rect = el.getBoundingClientRect();
          if (rect.height <= 0) continue;
          var inViewport = rect.top < viewportH && rect.bottom > 0;
          var aboveViewport = rect.bottom < 0;
          var nearBelow = rect.top < margin; // within 2 screens below the fold
          if (!inViewport && !aboveViewport && !nearBelow) continue;

          if (!isStuck(el)) continue;

          // Below-viewport elements are only revealed if the user already
          // scrolled past them; others stay at opacity 0 so the original
          // reveal animation still plays when the user scrolls to them.
          if (inViewport || aboveViewport) {
            reveal(el);
          }
        }
      } catch (e) { /* never throw */ }
    }

    function onScroll() {
      try {
        // Permanent: sweep on scroll for the page's lifetime (debounced), so
        // elements revealed late by slow hydration are caught even after 20s.
        if (scrollTimer) return;
        scrollTimer = setTimeout(function () {
          scrollTimer = null;
          sweep();
        }, SCROLL_DEBOUNCE_MS);
      } catch (e) { /* never throw */ }
    }

    function start() {
      try {
        window.addEventListener('scroll', onScroll, true);

        [1000, 2500, 5000, 8000, 12000].forEach(function (t) {
          setTimeout(function () { try { sweep(); } catch (e) {} }, t);
        });

        // Permanent slow-poll safety net: catches anything missed no matter
        // how late hydration/scroll happens.
        setInterval(function () { try { sweep(); } catch (e) {} }, 4000);

        // One sweep shortly after the full load event (assets, images ready).
        if (document.readyState === 'complete') {
          setTimeout(function () { try { sweep(); } catch (e) {} }, 300);
        } else {
          window.addEventListener('load', function () {
            setTimeout(function () { try { sweep(); } catch (e) {} }, 300);
          });
        }

        // Videos: force muted inline autoplay so hero/loop clips play even if
        // Framer's runtime did not get to them.
        var videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
          (function (v) {
            var attempts = 0;
            function tryPlay() {
              try {
                v.muted = true;
                v.playsInline = true;
                v.setAttribute('muted', '');
                v.setAttribute('playsinline', '');
                if (attempts === 0 && v.preload === 'none') {
                  try { v.load(); } catch (e) { /* never throw */ }
                }
                attempts++;
                var p = v.play();
                if (p && typeof p.catch === 'function') {
                  p.catch(function () {
                    // Retry when enough data arrives, and once more later.
                    v.addEventListener('canplay', function onCan() {
                      v.removeEventListener('canplay', onCan);
                      try { var q = v.play(); if (q && q.catch) q.catch(function () {}); } catch (e) { /* never throw */ }
                    });
                  });
                }
              } catch (e) { /* never throw */ }
            }
            tryPlay();
            // Videos with preload=none start loading only on play(); retry
            // a few times in case the first attempt raced the fetch.
            [2000, 5000, 9000].forEach(function (t) {
              setTimeout(function () {
                try { if (v.paused && v.readyState < 3) tryPlay(); } catch (e) { /* never throw */ }
              }, t);
            });
          })(videos[i]);
        }
      } catch (e) { /* never throw */ }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  } catch (e) { /* never throw */ }
})();
