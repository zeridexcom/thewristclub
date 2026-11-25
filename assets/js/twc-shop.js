/**
 * THEWRISTCLUB — shared shop library (catalog.html + product.html).
 * Vanilla JS, zero deps, dark-luxury theme helpers. Never throws.
 *
 * Data contract (SHOP_CONTRACT.md):
 *   assets/data/catalog-index.json -> [{brand, brandKey, category, count, cover}]
 *   assets/data/catalog/<brandKey>.json -> {brand, brandKey, category, cover, items:[{id,name,images,video,mrp,mrpNote,price,desc,specs}]}
 * Product URLs: product.html?p=<brandKey>/<n>  (n = 1-based index in the brand file)
 */
;(function () {
  'use strict';

  var API = {};
  var _indexPromise = null;
  var _brandCache = {};   /* brandKey -> Promise (resolved = data, rejected = error) */
  var _BRAND_RE = /^[a-z0-9][a-z0-9-]*$/i;

  /* ------------------------------------------------------------------ */
  /* Fetch + cache                                                       */
  /* ------------------------------------------------------------------ */

  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'reload' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  /** Load + cache catalog-index.json. Resolves to an array of brand entries. */
  API.loadIndex = function () {
    try {
      if (_indexPromise) return _indexPromise;
      _indexPromise = fetchJSON('assets/data/catalog-index.json').then(function (d) {
        var list = Array.isArray(d) ? d : (d && Array.isArray(d.brands) ? d.brands : []);
        return list.filter(function (b) { return b && b.brandKey; });
      });
      _indexPromise.catch(function () { _indexPromise = null; }); /* allow retry */
      return _indexPromise;
    } catch (_e) { return Promise.resolve([]); }
  };

  /** Load + cache one brand file. Resolves to {brand, brandKey, category, cover, items}. */
  API.loadBrand = function (brandKey) {
    try {
      if (!brandKey || typeof brandKey !== 'string') return Promise.reject(new Error('bad brandKey'));
      var key = String(brandKey);
      if (_brandCache[key]) return _brandCache[key];
      if (!_BRAND_RE.test(key)) return Promise.reject(new Error('invalid brandKey'));
      _brandCache[key] = fetchJSON('assets/data/catalog/' + encodeURIComponent(key) + '.json')
        .then(function (d) {
          if (!d || !Array.isArray(d.items)) throw new Error('malformed brand file');
          return d;
        });
      _brandCache[key].catch(function () { delete _brandCache[key]; }); /* allow retry */
      return _brandCache[key];
    } catch (e) { return Promise.reject(e); }
  };

  /* ------------------------------------------------------------------ */
  /* Query parsing                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Parse "?p=<brandKey>/<n>". Returns
   *   { ok:true, brandKey, n, raw } or { ok:false, reason, raw }.
   */
  API.parseQuery = function (search) {
    try {
      var q = search != null ? search : (typeof window !== 'undefined' ? window.location.search : '');
      var raw = '';
      try {
        var params = new URLSearchParams(q);
        raw = params.get('p') || '';
      } catch (_e) {
        var m = String(q).match(/[?&]p=([^&]*)/);
        raw = m ? decodeURIComponent(m[1]) : '';
      }
      raw = String(raw || '').trim();
      if (!raw) return { ok: false, reason: 'missing', raw: raw };
      var parts = raw.split('/');
      if (parts.length < 2 || !parts[0]) return { ok: false, reason: 'malformed', raw: raw };
      var key = parts[0].trim();
      var n = parseInt(parts[1], 10);
      if (!_BRAND_RE.test(key)) return { ok: false, reason: 'bad-brand', raw: raw };
      if (!isFinite(n) || n < 1) n = 1;
      return { ok: true, brandKey: key, n: n, raw: raw };
    } catch (_e) { return { ok: false, reason: 'error', raw: '' }; }
  };

  /** Full param reader for catalog.html (?cat= / ?brand= / ?sort=). */
  API.parseParams = function (search) {
    var out = { cat: 'all', brand: 'all', sort: 'brand', p: '' };
    try {
      var params = new URLSearchParams(search != null ? search : window.location.search);
      var cat = (params.get('cat') || '').toLowerCase();
      if (cat === 'him' || cat === 'her' || cat === 'unisex' || cat === 'all') out.cat = cat;
      var brand = (params.get('brand') || '').trim();
      if (brand) out.brand = brand;
      var sort = (params.get('sort') || '').toLowerCase();
      if (sort === 'name' || sort === 'price' || sort === 'brand') out.sort = sort;
      out.p = params.get('p') || '';
    } catch (_e) { /* defaults */ }
    return out;
  };

  /* ------------------------------------------------------------------ */
  /* Sorting + filtering helpers                                         */
  /* ------------------------------------------------------------------ */

  function nameOf(x) { return (x && typeof x.name === 'string' && x.name.trim()) ? x.name.trim() : ''; }
  function mrpOf(x) { return (x && typeof x.mrp === 'number' && isFinite(x.mrp)) ? x.mrp : null; }

  /**
   * Sort a copy of items. mode: 'name' (A–Z) | 'price' (mrp low→high,
   * null-mrp always last) | anything else = original order.
   */
  API.sortItems = function (items, mode) {
    try {
      var arr = (Array.isArray(items) ? items : []).slice();
      if (mode === 'name') {
        arr.sort(function (a, b) {
          var an = nameOf(a), bn = nameOf(b);
          if (!an && !bn) return 0;
          if (!an) return 1; /* unnamed last */
          if (!bn) return -1;
          return an.localeCompare(bn);
        });
      } else if (mode === 'price') {
        arr.sort(function (a, b) {
          var am = mrpOf(a), bm = mrpOf(b);
          if (am == null && bm == null) return nameOf(a).localeCompare(nameOf(b));
          if (am == null) return 1;   /* null-mrp always last */
          if (bm == null) return -1;
          return am - bm || nameOf(a).localeCompare(nameOf(b));
        });
      }
      return arr;
    } catch (_e) { return Array.isArray(items) ? items.slice() : []; }
  };

  /** Filter brand entries by category ('all' | 'him' | 'her' | 'unisex'). */
  API.byCategory = function (brands, cat) {
    try {
      var list = Array.isArray(brands) ? brands : [];
      if (!cat || cat === 'all') return list.slice();
      return list.filter(function (b) { return b && b.category === cat; });
    } catch (_e) { return []; }
  };

  /** Find one brand entry in the index by brandKey. */
  API.brandByKey = function (brands, brandKey) {
    try {
      var list = Array.isArray(brands) ? brands : [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].brandKey === brandKey) return list[i];
      }
    } catch (_e) { /* fallthrough */ }
    return null;
  };

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */

  /** "₹1,23,456" (Indian grouping) or "" when not a number. */
  API.formatINR = function (n) {
    try {
      if (typeof n !== 'number' || !isFinite(n)) return '';
      return '\u20B9' + Math.round(n).toLocaleString('en-IN');
    } catch (_e) { return ''; }
  };

  /** product.html?p=<brandKey>/<n> */
  API.itemURL = function (brandKey, n) {
    try {
      return 'product.html?p=' + encodeURIComponent(String(brandKey)) + '/' + (parseInt(n, 10) || 1);
    } catch (_e) { return 'catalog.html'; }
  };

  /* ------------------------------------------------------------------ */
  /* Card rendering (shared by catalog grid + collection strips)         */
  /* ------------------------------------------------------------------ */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /** 1-based index of an item inside its brand file (id suffix first, then lookup). */
  API.itemN = function (item, brandData) {
    try {
      var items = brandData && Array.isArray(brandData.items) ? brandData.items : [];
      if (item && typeof item.id === 'string' && brandData && brandData.brandKey &&
          item.id.indexOf(brandData.brandKey + '-') === 0) {
        var n = parseInt(item.id.slice(brandData.brandKey.length + 1), 10);
        if (isFinite(n) && n >= 1 && n <= items.length) return n;
      }
      var idx = items.indexOf(item);
      return idx >= 0 ? idx + 1 : 1;
    } catch (_e) { return 1; }
  };

  function imgFallback(img) {
    try {
      img.style.display = 'none';
      var parent = img.parentNode;
      if (parent) parent.classList.add('twc-img-missing');
    } catch (_e) { /* never throw */ }
  }

  /**
   * Build one product card (an <a> styled with .twc-card).
   * item: item object from a brand file; brand: brand entry from the index
   * (or a plain {brand, brandKey} / string); itemN: optional pre-computed
   * 1-based index; extraClass: optional extra class for the anchor.
   */
  API.renderCard = function (item, brand, itemN, extraClass) {
    try {
      item = item || {};
      var brandName = '', brandKey = '';
      if (typeof brand === 'string') { brandName = brand; }
      else if (brand) { brandName = brand.brand || brand.name || ''; brandKey = brand.brandKey || ''; }

      var n = (isFinite(itemN) && itemN >= 1) ? itemN : API.itemN(item, brand && brand.items ? brand : (brandKey ? { brandKey: brandKey, items: [] } : null));
      var name = nameOf(item) || 'Timepiece';
      var href = brandKey ? API.itemURL(brandKey, n) : 'catalog.html';

      var card = el('a', 'twc-card' + (extraClass ? ' ' + extraClass : ''));
      card.href = href;

      var wrap = el('div', 'twc-card-img');
      var src = item.thumb || (item.images && item.images[0]) || (brand && brand.cover) || '';
      if (src) {
        var img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = name;
        img.addEventListener('error', function () { imgFallback(img); });
        img.src = src;
        wrap.appendChild(img);
      } else {
        wrap.classList.add('twc-img-missing');
      }
      card.appendChild(wrap);

      var body = el('div', 'twc-card-body');
      if (brandName) body.appendChild(el('div', 'twc-card-brand', brandName));
      body.appendChild(el('div', 'twc-card-name', name));

      var mrp = mrpOf(item);
      var priceRow = el('div', 'twc-card-price');
      if (mrp != null) {
        var strike = el('span', 'twc-card-mrp', 'MRP ' + API.formatINR(mrp));
        priceRow.appendChild(strike);
      }
      priceRow.appendChild(el('span', 'twc-card-ourprice', (item && typeof item.price === 'string' && item.price.trim()) ? item.price : 'Price on Request'));
      body.appendChild(priceRow);

      card.appendChild(body);
      return card;
    } catch (_e) { return document.createDocumentFragment(); }
  };

  /** Inject the shared card stylesheet once per document. */
  API.injectCardStyles = function () {
    try {
      if (document.getElementById('twc-shop-card-styles')) return;
      var s = document.createElement('style');
      s.id = 'twc-shop-card-styles';
      s.textContent = [
        '.twc-card{font-family:"Geist","Geist Placeholder",ui-sans-serif,-apple-system,"Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column;background:#131313;border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;text-decoration:none;color:inherit;cursor:pointer;transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease}',
        '.twc-card:hover{transform:translateY(-5px);border-color:rgba(255,255,255,.3);box-shadow:0 16px 40px rgba(0,0,0,.5)}',
        '.twc-card-img{position:relative;aspect-ratio:3/4;background:#0d0d0d;overflow:hidden}',
        '.twc-card-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}',
        '.twc-card:hover .twc-card-img img{transform:scale(1.05)}',
        '.twc-img-missing{background:linear-gradient(135deg,#151310 0%,#0d0d0d 55%,#1a1810 100%)}',
        '.twc-img-missing:after{content:"TWC";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.16);font-size:28px;letter-spacing:6px;font-weight:600}',
        '.twc-card-body{padding:16px 18px 18px}',
        '.twc-card-brand{font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:7px;font-weight:600}',
        '.twc-card-name{font-size:15px;font-weight:500;color:#fff;margin-bottom:9px;line-height:1.42;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
        '.twc-card-price{display:flex;flex-direction:column;gap:2px;font-size:13px}',
        '.twc-card-mrp{color:rgba(255,255,255,.38);text-decoration:line-through;font-size:12.5px}',
        '.twc-card-ourprice{color:#fff;font-weight:600;font-size:13px;letter-spacing:.2px}'
      ].join('\n');
      document.head.appendChild(s);
    } catch (_e) { /* never throw */ }
  };

  /* ------------------------------------------------------------------ */
  /* Debug + export                                                      */
  /* ------------------------------------------------------------------ */

  window.TWCSHOP = API;
  /* inject shared card styles automatically — every page using renderCard needs them */
  try { if (document.head) API.injectCardStyles(); else document.addEventListener('DOMContentLoaded', function(){ try { API.injectCardStyles(); } catch(_e){} }, {once:true}); } catch (_e) {}
  window.__twcShop = {
    version: '1.0.0',
    state: function () {
      return {
        indexLoaded: !!(_indexPromise && _indexPromise._twcResolved),
        brandsCached: Object.keys(_brandCache).length,
        cacheKeys: Object.keys(_brandCache)
      };
    },
    api: API
  };
  /* resolution flag for the debug state */
  try {
    var origLoadIndex = API.loadIndex;
    API.loadIndex = function () {
      var p = origLoadIndex();
      p.then(function () { p._twcResolved = true; }).catch(function () {});
      return p;
    };
  } catch (_e) { /* never throw */ }
})();
