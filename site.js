/* =========================================================
   RAJIN: EDGE OF DARKNESS, SITE SCRIPT
   Builds each page from content.js. You shouldn't need to edit
   this file to change words or pictures; edit content.js instead.
   ========================================================= */
(function () {
  'use strict';
  var S = window.SITE || {};
  var A = 'assets/';

  /* tiny helper that makes an element: h('div', { class: 'x' }, child1, child2) */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
  function img(name, alt, extra) {
    var p = { src: A + name, alt: alt || '', loading: 'lazy', decoding: 'async' };
    if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
    return h('img', p);
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = $('.menu-btn'), nav = $('.nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- lightbox: tap any picture to see it full size ---------- */
  var LB = { items: [], i: 0, el: null };
  function buildLB() {
    var el = h('div', { class: 'lb', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Picture viewer' },
      h('span', { class: 'lb-count' }),
      h('img', { alt: '' }),
      h('p', { class: 'lb-cap' }),
      h('button', { class: 'lb-close', type: 'button', 'aria-label': 'Close', text: '\u00d7', onclick: closeLB }),
      h('button', { class: 'lb-prev', type: 'button', 'aria-label': 'Previous picture', text: '\u2039', onclick: function (e) { e.stopPropagation(); stepLB(-1); } }),
      h('button', { class: 'lb-next', type: 'button', 'aria-label': 'Next picture', text: '\u203a', onclick: function (e) { e.stopPropagation(); stepLB(1); } }));
    el.addEventListener('click', function (e) { if (e.target === el) closeLB(); });
    var sx = 0, sy = 0;
    el.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    el.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) stepLB(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.body.appendChild(el);
    return el;
  }
  function openLB(items, i) {
    LB.el = LB.el || buildLB();
    LB.items = items; LB.i = i || 0;
    showLB();
    LB.el.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    $('.lb-close', LB.el).focus();
  }
  function showLB() {
    var it = LB.items[LB.i], el = LB.el, many = LB.items.length > 1;
    $('img', el).src = A + it.src;
    $('img', el).alt = it.alt || it.caption || '';
    $('.lb-cap', el).textContent = it.caption || '';
    $('.lb-count', el).textContent = many ? (LB.i + 1) + ' / ' + LB.items.length : '';
    $('.lb-prev', el).style.display = many ? '' : 'none';
    $('.lb-next', el).style.display = many ? '' : 'none';
  }
  function stepLB(d) { LB.i = (LB.i + d + LB.items.length) % LB.items.length; showLB(); }
  function closeLB() { if (!LB.el) return; LB.el.classList.remove('open'); document.documentElement.style.overflow = ''; }
  document.addEventListener('keydown', function (e) {
    if (!LB.el || !LB.el.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowRight') stepLB(1);
    if (e.key === 'ArrowLeft') stepLB(-1);
  });

  /* ---------- Tumblr: pulls your newest public posts, no login needed ---------- */
  function loadTumblr(count, done) {
    var blog = S.tumblr, finished = false;
    if (!blog) { done(null); return; }
    var timer = setTimeout(function () { if (!finished) { finished = true; done(null); } }, 8000);
    var s = document.createElement('script');
    s.src = 'https://' + blog + '.tumblr.com/api/read/json?num=' + count + '&filter=text';
    s.onload = function () {
      if (finished) return;
      finished = true; clearTimeout(timer);
      var data = window.tumblr_api_read;
      done(data && data.posts ? data.posts : null);
    };
    s.onerror = function () { if (!finished) { finished = true; clearTimeout(timer); done(null); } };
    document.head.appendChild(s);
  }
  function plain(html) {
    var d = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    return (d.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function firstImage(html) {
    var m = /<img[^>]+src="(https:\/\/[^"]+)"/i.exec(html || '');
    return m ? m[1] : '';
  }
  function postCard(p) {
    var body = p['regular-body'] || p['photo-caption'] || p['video-caption'] || p['link-description'] || p.answer || p['quote-text'] || '';
    var title = p['regular-title'] || p['link-text'] || p.question || '';
    var text = plain(body);
    if (!title) { var m = /^[^.!?]{1,120}[.!?]/.exec(text); title = m ? m[0] : (text.slice(0, 80) || 'New post'); text = text.slice(title.length).trim(); }
    if (title.length > 90) title = title.slice(0, 88) + '\u2026';
    if (text.length > 150) text = text.slice(0, 148).replace(/\s+\S*$/, '') + '\u2026';
    var pic = p['photo-url-500'] || firstImage(p['regular-body'] || p['photo-caption'] || '');
    var when = p['unix-timestamp'] ? new Date(p['unix-timestamp'] * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return h('a', { class: 'post', href: p['url-with-slug'] || p.url, target: '_blank', rel: 'noopener' },
      pic && /^https:\/\//.test(pic) ? h('img', { src: pic, alt: '', loading: 'lazy' }) : null,
      h('div', { class: 'p-body' },
        when ? h('time', { text: when }) : null,
        h('strong', { text: title }),
        text ? h('p', { text: text }) : null,
        h('span', { class: 'more', text: 'Read on Tumblr \u203a' })));
  }
  function renderFeed(box, count) {
    if (!box) return;
    var blogUrl = 'https://' + S.tumblr + '.tumblr.com';
    box.textContent = '';
    box.appendChild(h('p', { class: 'feed-note', text: 'Loading the latest posts\u2026' }));
    loadTumblr(count, function (posts) {
      box.textContent = '';
      if (!posts || !posts.length) {
        box.appendChild(h('p', { class: 'feed-note' }, 'The latest posts live on Tumblr. ',
          h('a', { href: blogUrl, target: '_blank', rel: 'noopener', text: 'Visit the blog \u203a' })));
        return;
      }
      box.appendChild(h('div', { class: 'posts' }, posts.map(postCard)));
    });
  }

  /* ---------- home ---------- */
  function pageHome() {
    var crew = $('#crew');
    if (crew) (S.characters || []).filter(function (c) { return !c.glitch; }).forEach(function (c) {
      var a = h('a', { href: 'characters.html#' + slug(c.name) }, img(c.image, c.name), h('span', { text: c.name }));
      if (c.color) a.style.setProperty('--c', c.color);
      crew.appendChild(a);
    });
    renderFeed($('#feed'), 3);
  }

  /* ---------- characters ---------- */
  function lineupEl(c) {
    if (!c.lineup) return null;
    var i = h('i');
    i.style.setProperty('--m', 'url("' + A + 'lineup-' + c.lineup + '.png")');
    i.style.setProperty('--c', c.color || '#ff6a2b');
    return h('figure', { class: 'lineup-fig' }, h('div', { class: 'lineup', role: 'img', 'aria-label': 'Height chart with ' + c.name + ' highlighted' }, i),
      h('figcaption', { text: 'Height chart' }));
  }
  function refsEl(c) {
    var refs = c.refs || [];
    if (!refs.length) return null;
    var items = [], starts = [], tilt = [-3, 2.5, -1.5, 3];
    refs.forEach(function (r) {
      starts.push(items.length);
      if (r.color) items.push({ src: r.color, caption: c.name + ', ' + (r.lines ? 'color' : (r.label || 'color')) });
      if (r.lines) items.push({ src: r.lines, caption: c.name + ', line art' });
    });
    return h('div', null,
      h('div', { class: 'refs-cap', text: 'Reference sheets, tap to enlarge' }),
      h('div', { class: 'ref-board' }, refs.map(function (r, k) {
        var pair = !!(r.color && r.lines), label = r.label || (pair ? 'Color + lines' : r.color ? 'Color' : 'Line art');
        var b = h('button', { class: 'ref-pin', type: 'button', 'aria-label': c.name + ' reference sheet, ' + label, onclick: function () { openLB(items, starts[k]); } },
          pair ? h('span', { class: 'rp-back' }, img(r.linesThumb || r.thumb, '')) : null,
          h('span', { class: 'rp-card' }, img(r.thumb, ''), h('span', { class: 'rp-label', text: label })),
          h('span', { class: 'rp-tack', 'aria-hidden': 'true' }));
        b.style.setProperty('--rot', tilt[k % tilt.length] + 'deg');
        return b;
      })));
  }
  function pageCharacters() {
    var box = $('#characters');
    if (!box) return;
    (S.characters || []).forEach(function (c) {
      var info = h('div', { class: 'char-info' },
        h('div', { class: 'char-head' },
          h('div', { class: 'char-head-txt' },
            h('h2', { class: c.glitch ? 'glitch' : null, text: c.name }),
            c.title ? h('div', { class: 'caption title', text: c.title }) : null),
          lineupEl(c)),
        c.facts && c.facts.length ? h('div', { class: 'caption facts' }, h('span', { class: 'facts-cap', text: 'Fun facts' }),
          h('ul', null, c.facts.map(function (f) { return h('li', { text: f }); }))) : null,
        c.notes ? h('div', { class: 'caption notes' + (c.glitch ? ' corrupt' : ''), text: c.notes }) : null,
        refsEl(c));
      var sec = h('section', { class: 'char', id: c.glitch ? 'unknown' : slug(c.name) },
        h('button', { class: 'char-art zoomable', type: 'button', 'aria-label': 'Enlarge ' + (c.glitch ? 'the corrupted file' : c.name),
          onclick: function () { openLB([{ src: c.image, caption: c.glitch ? '' : c.name }], 0); } },
          img(c.image, c.glitch ? 'A corrupted, unknown figure' : c.name + ' character art')),
        info);
      if (c.color) sec.style.setProperty('--c', c.color);
      box.appendChild(sec);
    });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 60); }
  }

  /* ---------- concept art: masonry in reading order, bigger tiles for the best pieces ---------- */
  function packArt(grid) {
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 16;
    Array.prototype.forEach.call(grid.children, function (t) {
      t.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((t.offsetHeight + gap) / 4));
    });
  }
  function pageArt() {
    var grid = $('#art-grid');
    if (!grid) return;
    var list = S.art || [];
    var items = list.map(function (a) { return { src: a.image, caption: a.title || '' }; });
    list.forEach(function (a, k) {
      var im = img(a.image, a.title || 'Rajin concept art', k < 8 ? { loading: 'eager' } : null);
      if (a.size) im.style.aspectRatio = a.size[0] + ' / ' + a.size[1];
      im.addEventListener('load', function () { packArt(grid); });
      grid.appendChild(h('button', { class: 'art-tile' + (a.big ? ' big' : ''), type: 'button', 'aria-label': 'Enlarge concept art ' + (k + 1),
        onclick: function () { openLB(items, k); } }, im));
    });
    packArt(grid);
    var lastW = 0;
    window.addEventListener('resize', function () { if (Math.abs(window.innerWidth - lastW) > 1) { lastW = window.innerWidth; packArt(grid); } });
  }

  /* ---------- simple picture grids ---------- */
  function tileGrid(box, list, opts) {
    if (!box) return;
    var items = list.map(function (x) { return { src: x.image, caption: x.label || '' }; });
    list.forEach(function (x, k) {
      box.appendChild(h('button', { class: 'tile', type: 'button', 'aria-label': 'Enlarge ' + (x.label || 'picture ' + (k + 1)), onclick: function () { openLB(items, k); } },
        img(x.thumb || x.image, x.label || ''), opts && opts.labels && x.label ? h('span', { text: x.label }) : null));
    });
  }

  /* ---------- ship ---------- */
  function pageShip() {
    var sh = S.ship || {};
    tileGrid($('#ship-views'), sh.views || [], { labels: true });
    tileGrid($('#ship-renders'), sh.renders || []);
    var bp = $('#blueprints');
    if (bp) (sh.blueprints || []).forEach(function (b, k) {
      var items = (sh.blueprints || []).map(function (x) { return { src: x.image, caption: x.label }; });
      bp.appendChild(h('div', { class: 'section' },
        h('h3', { text: b.label }),
        h('button', { class: 'tile', type: 'button', style: '--ar:4/3;margin-top:12px;width:100%', 'aria-label': 'Enlarge blueprint, ' + b.label, onclick: function () { openLB(items, k); } },
          img(b.image, 'Rajin blueprint, ' + b.label)),
        h('ul', { class: 'bp-key' }, (b.key || []).map(function (r) { return h('li', null, h('b', { text: r[0] + '.' }), r[1]); }))));
    });
  }

  /* ---------- timelapses ---------- */
  function pageTimelapses() {
    var list = S.timelapses || [], video = $('#tl-video'), rail = $('#tl-rail'), now = $('#tl-now');
    if (!video || !list.length) return;
    function play(k, auto) {
      var t = list[k];
      video.poster = A + t.thumb;
      video.src = A + t.video;
      now.textContent = 'Now playing: ' + t.title;
      Array.prototype.forEach.call(rail.children, function (b, i) { b.classList.toggle('on', i === k); b.setAttribute('aria-pressed', i === k ? 'true' : 'false'); });
      if (auto) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    list.forEach(function (t, k) {
      rail.appendChild(h('button', { class: 'tl-pick', type: 'button', 'aria-label': 'Play the ' + t.title + ' timelapse', onclick: function () { play(k, true); } },
        img(t.thumb, ''), h('span', { text: t.title })));
    });
    play(0, false);
  }

  /* ---------- story ---------- */
  function pageStory() {
    var tl = $('#timeline');
    if (tl) (S.timeline || []).forEach(function (e) {
      tl.appendChild(h('li', { class: e.when || null }, h('b', { text: e.year }), e.text, e.when === 'now' ? ' (we are here)' : ''));
    });
    tileGrid($('#storyboards'), (S.storyboards || []).map(function (s, k) { return { image: s.image, label: 'Storyboard ' + (k + 1) }; }));
    var z = S.zine || [], zi = 0, zImg = $('#zine-img'), zNum = $('#zine-num');
    if (zImg && z.length) {
      var zItems = z.map(function (p, k) { return { src: p.image, caption: 'Page ' + (k + 1) + ' of ' + z.length }; });
      var show = function () { zImg.src = A + z[zi].image; zImg.alt = 'Zine page ' + (zi + 1); zNum.textContent = 'Page ' + (zi + 1) + ' of ' + z.length; };
      $('#zine-prev').addEventListener('click', function () { zi = (zi - 1 + z.length) % z.length; show(); });
      $('#zine-next').addEventListener('click', function () { zi = (zi + 1) % z.length; show(); });
      zImg.addEventListener('click', function () { openLB(zItems, zi); });
      show();
    }
    var sp = (S.scriptPages || [])[0], spBox = $('#script-page');
    if (sp && spBox) {
      spBox.appendChild(h('button', { class: 'tile', type: 'button', 'aria-label': 'Enlarge the finished page', onclick: function () { openLB([{ src: sp.image, caption: 'Pages 1 and 2' }], 0); } },
        img(sp.image, 'Finished comic pages 1 and 2'), h('span', { text: 'The finished pages' })));
      spBox.appendChild(h('pre', { text: sp.script || '' }));
    }
  }

  /* ---------- then and now: drag the slider to watch each design grow up ---------- */
  function evoBlock(title, list) {
    if (!list || !list.length) return null;
    var stage = h('div', { class: 'evo-stage' }, list.map(function (e, k) { return img(e.image, title + ', ' + e.year, k < 2 ? { loading: 'eager' } : null); }));
    var year = h('div', { class: 'evo-year', text: list[0].year });
    var cap = h('p', { class: 'lede', text: list[0].caption || '' });
    var range = h('input', { type: 'range', min: 0, max: list.length - 1, step: 0.01, value: 0, 'aria-label': 'Move through the years of ' + title.toLowerCase() });
    function update() {
      var v = parseFloat(range.value), lo = Math.floor(v), hi = Math.min(list.length - 1, lo + 1), f = v - lo;
      Array.prototype.forEach.call(stage.children, function (im, k) {
        im.style.opacity = k === lo ? 1 - f : k === hi ? f : 0;
      });
      var near = list[Math.round(v)];
      year.textContent = near.year; cap.textContent = near.caption || '';
    }
    range.addEventListener('input', update);
    update();
    return h('div', { class: 'evo' }, stage,
      h('div', null, h('h2', { text: title }), year, range,
        h('div', { class: 'evo-ticks' }, h('span', { text: list[0].year }), h('span', { text: list[list.length - 1].year })), cap));
  }
  function pageEvolution() {
    var box = $('#evolution'), E = S.evolution || {};
    if (box) [['The logo', E.logo], ['The cover', E.cover], ['The ship', E.ship]].forEach(function (p) { add(box, evoBlock(p[0], p[1])); });
    var eras = $('#eras'), st = S.story || {};
    if (eras) {
      (st.eras || []).forEach(function (e) { eras.appendChild(h('div', { class: 'era' }, h('h3', { text: e.era }), e.lines.map(function (l) { return h('p', { text: l }); }))); });
      if (st.note) eras.parentNode.appendChild(h('p', { class: 'caption', style: 'margin-top:18px;display:inline-block', text: st.note }));
    }
  }

  /* ---------- updates ---------- */
  function pageUpdates() { renderFeed($('#feed'), 12); }

  /* ---------- footer credit and Tumblr links pick up content.js ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-credit]'), function (el) { if (S.credit) el.textContent = S.credit; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-tumblr]'), function (el) { if (S.tumblr) el.href = 'https://' + S.tumblr + '.tumblr.com'; });

  var page = document.body.getAttribute('data-page');
  ({ home: pageHome, characters: pageCharacters, art: pageArt, ship: pageShip, timelapses: pageTimelapses,
     story: pageStory, evolution: pageEvolution, updates: pageUpdates }[page] || function () {})();

  /* ---------- iPad with a trackpad: Safari there ignores cursor images, so draw the quill ---------- */
  (function () {
    var isIPad = navigator.maxTouchPoints > 1 && /Macintosh|iPad/.test(navigator.userAgent);
    if (!isIPad) return;
    var CLICK = 'a[href],button:not(:disabled),[role="button"],summary,label,select,input[type="range"],.zoomable';
    var el = null, x = 0, y = 0, raf = 0, on = false;
    function make() {
      el = h('div', { class: 'quill-cur', 'aria-hidden': 'true' },
        h('span', { class: 'qc-in' }, h('img', { class: 'qc-plain', alt: '', src: A + 'quill-2x.png' }), h('img', { class: 'qc-glow', alt: '', src: A + 'quill-glow-2x.png' })));
      document.body.appendChild(el);
    }
    function draw() { raf = 0; if (el) el.style.transform = 'translate3d(' + (x - 6) + 'px,' + (y - 2) + 'px,0)'; }
    function hide() { if (!on) return; on = false; if (el) el.classList.remove('show'); document.documentElement.classList.remove('quill-on'); }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { hide(); return; }
      if (!el) make();
      x = e.clientX; y = e.clientY;
      el.classList.toggle('hot', !!(e.target && e.target.closest && e.target.closest(CLICK)));
      if (!on) { on = true; el.classList.add('show'); document.documentElement.classList.add('quill-on'); }
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') hide(); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
  })();
})();
