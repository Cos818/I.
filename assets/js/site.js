/* Toniva landing page. Plain JavaScript, no framework or backend required. */

/* Navigation: mobile menu, active section highlighting, reveal-on-scroll. */
(function () {
  'use strict';
  var toggle = document.querySelector('.menu-toggle');
  var panel = document.getElementById('mobile-navigation');
  var open = false;
  function menu(state) {
    open = state;
    panel.dataset.open = String(state);
    toggle.setAttribute('aria-expanded', String(state));
    toggle.setAttribute('aria-label', state ? 'Close navigation' : 'Open navigation');
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () { menu(!open); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { menu(false); toggle.focus(); } });
    matchMedia('(min-width: 981px)').addEventListener('change', function (e) { if (e.matches && open) menu(false); });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && targets.length) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        current = entry.target.id;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  var revealNodes = Array.prototype.slice.call(document.querySelectorAll('.section__head, .card, .audience, .stat, .split__copy, .media'));
  revealNodes.forEach(function (n) { n.setAttribute('data-reveal', ''); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealNodes.forEach(function (n) { n.dataset.revealed = 'true'; });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.dataset.revealed = 'true'; ro.unobserve(entry.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    revealNodes.forEach(function (n) { ro.observe(n); });
  }
})();

/* Tickers (rails chips, partner logos): duplicate the items once so each strip loops seamlessly. */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.rails__list, .partners__list'), function (list) {
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var c = li.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(c.querySelectorAll('a'), function (a) { a.tabIndex = -1; });
      list.appendChild(c);
    });
  });
})();

/* Panel fit: every band is a full-screen panel. When a panel's content is taller than the
   space below the header, scale the content down just enough to fit (desktop widths only). */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.hero, main > .section:not(.glance):not(.partners), .cta-band'));
  if (!header || !panels.length) return;
  var MIN_ZOOM = 0.5, raf = null;
  function fit() {
    raf = null;
    var avail = window.innerHeight - header.offsetHeight;
    var narrow = window.innerWidth < 700;
    panels.forEach(function (p) {
      var inner = p.querySelector(':scope > .container');
      if (!inner) return;
      inner.style.zoom = '';
      if (narrow) return;
      var cs = getComputedStyle(p);
      var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var room = avail - pad - 2, need = inner.offsetHeight;
      if (need <= room) return;
      var z = Math.max(MIN_ZOOM, room / need);
      inner.style.zoom = z.toFixed(3);
    });
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(fit); }
  fit();
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  setTimeout(schedule, 400);
})();

/* Enquiry forms (hero and dialog). This preview is not connected to an inbox. */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('form[data-review-form]'), function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var status = form.querySelector('.form-status');
      if (!status) return;
      status.hidden = false;
      status.textContent = 'Your entries are valid. This preview is not connected to an inbox yet, so nothing was sent.';
      status.tabIndex = -1; status.focus();
    });
  });
})();

/* Contact dialog: open from any "Contact sales" / "Request access" / "Enquire" link. */
(function () {
  'use strict';
  var dlg = document.getElementById('contact-dialog');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var topic = dlg.querySelector('#contact-topic');
  var opener = null;

  function open(preset) {
    if (preset === 'financial-institutions') preset = 'financial-institution';
    if (preset && topic && Array.prototype.some.call(topic.options, function (o) { return o.value === preset; })) topic.value = preset;
    opener = document.activeElement;
    dlg.showModal();
    document.documentElement.classList.add('dialog-open');
    var first = dlg.querySelector('input, select, textarea');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function close() { dlg.close(); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="contact.html"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    var m = /[?&]topic=([^&#]+)/.exec(a.getAttribute('href'));
    open(m ? decodeURIComponent(m[1]) : null);
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-dialog-close]')) close();
  });
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('dialog-open');
    if (opener && opener.focus) opener.focus();
  });
})();

/* Live currency converter. Mid-market reference rates from a public daily feed
   (open.er-api.com, no key, 160+ currencies). Converts as you type. No dependencies. */
(function () {
  'use strict';
  var widget = document.querySelector('.fx-widget');
  if (!widget) return;

  function parseErApi(d) { if (d && d.result === 'success' && d.rates) return { rates: d.rates, updated: (d.time_last_update_unix || Math.floor(Date.now() / 1000)) * 1000 }; }
  function parseCdnApi(d) {
    if (!d || !d.usd) return;
    var r = {}; Object.keys(d.usd).forEach(function (k) { r[k.toUpperCase()] = d.usd[k]; });
    var when = d.date ? Date.parse(d.date + 'T00:00:00Z') : Date.now();
    return { rates: r, updated: isFinite(when) ? when : Date.now() };
  }
  var FEEDS = [
    { url: 'https://open.er-api.com/v6/latest/USD', parse: parseErApi },
    { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', parse: parseCdnApi },
    { url: 'https://latest.currency-api.pages.dev/v1/currencies/usd.json', parse: parseCdnApi }
  ];
  var CACHE_KEY = 'toniva-fx-usd-v2';
  var CACHE_MAX_AGE = 36 * 60 * 60 * 1000;

  /* Every currency the feed publishes, so the lists are full before the first byte arrives. */
  var CODES = 'USD AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLF CLP CNH CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP FOK GBP GEL GGP GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS IMP INR IQD IRR ISK JEP JMD JOD JPY KES KGS KHR KID KMF KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TVD TWD TZS UAH UGX UYU UZS VES VND VUV WST XAF XCD XCG XDR XOF XPF YER ZAR ZMW ZWG ZWL'.split(' ').sort();
  var EXTRA_NAMES = { CLF: 'Chilean unit of account', CNH: 'Chinese yuan (offshore)', FOK: 'Faroese króna', GGP: 'Guernsey pound', IMP: 'Manx pound', JEP: 'Jersey pound', KID: 'Kiribati dollar', TVD: 'Tuvaluan dollar', XCG: 'Caribbean guilder', XDR: 'IMF special drawing rights', ZWG: 'Zimbabwe gold', SLE: 'Sierra Leonean leone', MRU: 'Mauritanian ouguiya', STN: 'São Tomé and Príncipe dobra', VES: 'Venezuelan bolívar' };
  var ZERO_DECIMAL = { BIF:1, CLP:1, DJF:1, GNF:1, IDR:1, ISK:1, JPY:1, KMF:1, KRW:1, LAK:1, MGA:1, PYG:1, RWF:1, UGX:1, VND:1, VUV:1, XAF:1, XOF:1, XPF:1 };

  /* Built-in reference table (mid-market, 21 Oct 2026) so the converter works even when the feed is unreachable. */
  var SNAPSHOT = { updated: 1792540952000, rates: {"USD":1,"AED":3.6725,"AFN":64.758442,"ALL":81.011467,"AMD":361.710661,"ANG":1.79,"AOA":926.665703,"ARS":1524.8401,"AUD":1.428632,"AWG":1.79,"AZN":1.699946,"BAM":1.7421,"BBD":2,"BDT":123.666224,"BGN":1.7421,"BHD":0.376,"BIF":2996.643976,"BMD":1,"BND":1.278145,"BOB":11.685224,"BRL":5.023053,"BSD":1,"BTN":94.990338,"BWP":13.993177,"BYN":2.979399,"BZD":2,"CAD":1.40605,"CDF":2310.517537,"CHF":0.825328,"CLF":0.024825,"CLP":981.251342,"CNH":6.676132,"CNY":6.691314,"COP":3153.773599,"CRC":454.325595,"CUP":24,"CVE":98.21539,"CZK":21.656574,"DJF":177.721,"DKK":6.66328,"DOP":61.508609,"DZD":134.552008,"EGP":54.488856,"ERN":15,"ETB":161.288291,"EUR":0.89075,"FJD":2.258721,"FKP":0.748328,"FOK":6.661495,"GBP":0.748335,"GEL":2.59675,"GGP":0.748328,"GHS":11.654668,"GIP":0.748328,"GMD":74.606325,"GNF":8829.740692,"GTQ":7.64428,"GYD":209.099096,"HKD":7.848269,"HNL":26.871772,"HRK":6.71114,"HTG":130.981457,"HUF":324.37318,"IDR":18001.598375,"ILS":3.097989,"IMP":0.748328,"INR":94.995216,"IQD":1517.23689,"IRR":1731936.861971,"ISK":121.331516,"JEP":0.748328,"JMD":158.774079,"JOD":0.709,"JPY":158.224062,"KES":129.806918,"KGS":87.478115,"KHR":4052.84205,"KID":1.428731,"KMF":438.206178,"KRW":1327.17027,"KWD":0.309652,"KYD":0.833333,"KZT":450.272788,"LAK":22334.464342,"LBP":89500,"LKR":331.602916,"LRD":170.872071,"LSL":16.397748,"LYD":6.416029,"MAD":9.799319,"MDL":17.860234,"MGA":4585.050048,"MKD":55.076251,"MMK":2098.294366,"MNT":3580.035284,"MOP":8.083724,"MRU":40.133859,"MUR":47.347194,"MVR":15.447738,"MWK":1742.045688,"MXN":18.441949,"MYR":4.082917,"MZN":63.695212,"NAD":16.397748,"NGN":1332.684114,"NIO":36.811405,"NOK":9.402396,"NPR":151.984541,"NZD":1.760423,"OMR":0.384497,"PAB":1,"PEN":3.437582,"PGK":4.494472,"PHP":63.087647,"PKR":277.013331,"PLN":3.892317,"PYG":5744.288917,"QAR":3.64,"RON":4.747284,"RSD":104.630404,"RUB":82.571905,"RWF":1477.841382,"SAR":3.75,"SBD":7.954968,"SCR":14.668119,"SDG":449.230827,"SEK":9.90724,"SGD":1.278172,"SHP":0.748328,"SLE":24.357927,"SLL":24357.92723,"SOS":571.433394,"SRD":37.720986,"SSP":5751.428598,"STN":21.822673,"SYP":121.69626,"SZL":16.397748,"THB":33.616253,"TJS":9.232461,"TMT":3.50001,"TND":2.995886,"TOP":2.390299,"TRY":49.597774,"TTD":6.765943,"TVD":1.428731,"TWD":32.626371,"TZS":2641.303556,"UAH":45.092182,"UGX":4040.73985,"UYU":40.144606,"UZS":11976.48893,"VES":883.3963,"VND":25846.196303,"VUV":119.384688,"WST":2.7366,"XAF":584.274904,"XCD":2.7,"XCG":1.79,"XDR":0.738234,"XOF":584.274904,"XPF":106.29156,"YER":236.188042,"ZAR":16.397238,"ZMW":20.173445,"ZWG":26.6124,"ZWL":26.6124} };

  var names = null;
  try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) {}
  function nameOf(code) {
    if (EXTRA_NAMES[code]) return EXTRA_NAMES[code];
    try { var n = names && names.of(code); if (n && n !== code) return n.charAt(0).toUpperCase() + n.slice(1); } catch (e) {}
    return code;
  }

  var $ = function (sel) { return widget.querySelector(sel); };
  var amountInput = $('#fx-amount'), fromSel = $('#fx-from'), toSel = $('#fx-to');
  var statusEl = $('.fx-widget__status'), pairEl = $('.fx-widget__pair'), leadEl = $('.fx-widget__lead');
  var resultEl = $('.fx-widget__result'), rateEl = $('.fx-widget__rate'), updatedEl = $('.fx-widget__updated'), errorEl = $('.fx-widget__error');
  var table = null;

  function fillSelect(select, selected, codes) {
    var keep = select.value || selected;
    select.innerHTML = '';
    codes.forEach(function (code) {
      var o = document.createElement('option'); o.value = code; o.textContent = code + ' · ' + nameOf(code);
      select.appendChild(o);
    });
    select.value = codes.indexOf(keep) >= 0 ? keep : selected;
  }
  fillSelect(fromSel, 'SAR', CODES); fillSelect(toSel, 'NGN', CODES);

  /* Custom picker: a styled listbox driving the hidden native select */
  function enhance(select, align) {
    var wrap = document.createElement('div'); wrap.className = 'fx-select'; if (align) wrap.dataset.align = align;
    select.parentNode.insertBefore(wrap, select); wrap.appendChild(select);
    select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
    var label = widget.querySelector('label[for="' + select.id + '"]');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fx-select__btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    btn.id = select.id + '-btn'; if (label) { btn.setAttribute('aria-labelledby', label.id || (label.id = select.id + '-label')); label.htmlFor = btn.id; }
    btn.innerHTML = '<span class="fx-select__code"></span><span class="fx-select__name"></span>';
    var panel = document.createElement('div'); panel.className = 'fx-select__panel';
    var search = document.createElement('input'); search.type = 'text'; search.className = 'fx-select__search';
    search.placeholder = 'Search currency'; search.autocomplete = 'off'; search.spellcheck = false; search.setAttribute('aria-label', 'Search currency');
    var list = document.createElement('ul'); list.className = 'fx-select__list'; list.setAttribute('role', 'listbox'); list.id = select.id + '-list';
    panel.appendChild(search); panel.appendChild(list); wrap.appendChild(btn); wrap.appendChild(panel);
    var items = [], active = -1, open = false;

    function labelFor(code) { var o = select.querySelector('option[value="' + code + '"]'); return o ? o.textContent.split(' · ')[1] || '' : ''; }
    function paintBtn() { var nm = labelFor(select.value); btn.querySelector('.fx-select__code').textContent = select.value; btn.querySelector('.fx-select__name').textContent = nm; btn.title = select.value + ' · ' + nm; }
    function build(filter) {
      list.innerHTML = ''; items = []; active = -1;
      var f = (filter || '').trim().toLowerCase();
      Array.prototype.forEach.call(select.options, function (o) {
        var parts = o.textContent.split(' · '), code = o.value, name = parts[1] || '';
        if (f && code.toLowerCase().indexOf(f) < 0 && name.toLowerCase().indexOf(f) < 0) return;
        var li = document.createElement('li'); li.className = 'fx-select__opt'; li.setAttribute('role', 'option'); li.dataset.value = code;
        li.setAttribute('aria-selected', String(code === select.value)); li.id = list.id + '-' + code;
        li.innerHTML = '<span class="fx-select__code">' + code + '</span><span class="fx-select__name">' + name + '</span>';
        li.addEventListener('mousemove', function () { setActive(items.indexOf(li)); });
        li.addEventListener('click', function () { choose(code); });
        list.appendChild(li); items.push(li);
      });
      if (!items.length) { var e = document.createElement('li'); e.className = 'fx-select__empty'; e.textContent = 'No currency matches “' + filter + '”'; list.appendChild(e); }
      var sel = items.findIndex(function (li) { return li.dataset.value === select.value; });
      setActive(sel >= 0 ? sel : (items.length ? 0 : -1), true);
    }
    function setActive(i, scroll) {
      items.forEach(function (li, k) { li.dataset.active = String(k === i); });
      active = i;
      if (i >= 0) { list.setAttribute('aria-activedescendant', items[i].id); if (scroll !== false) items[i].scrollIntoView({ block: 'nearest' }); }
    }
    function choose(code) {
      if (select.value !== code) { select.value = code; select.dispatchEvent(new Event('change', { bubbles: true })); }
      paintBtn(); close(); btn.focus();
    }
    function openPanel() { if (open) return; open = true; wrap.dataset.open = 'true'; widget.dataset.pickerOpen = 'true'; btn.setAttribute('aria-expanded', 'true'); search.value = ''; build(''); setTimeout(function () { search.focus(); }, 0); }
    function close() { if (!open) return; open = false; wrap.dataset.open = 'false'; widget.dataset.pickerOpen = 'false'; btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function () { open ? close() : openPanel(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openPanel(); } });
    search.addEventListener('input', function () { build(search.value); });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); btn.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) setActive(Math.min(active + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setActive(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) choose(items[active].dataset.value); }
      else if (e.key === 'Tab') { close(); }
    });
    document.addEventListener('pointerdown', function (e) { if (open && !wrap.contains(e.target)) close(); });
    select.addEventListener('change', paintBtn);
    select._fxRefresh = paintBtn;
    paintBtn();
  }
  enhance(fromSel); enhance(toSel, 'right');

  function fmtAmount(n, code) {
    var d = ZERO_DECIMAL[code] ? 0 : 2;
    return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtRate(r) {
    var d = r >= 100 ? 2 : r >= 1 ? 4 : 6;
    return r.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function parseAmount(text) {
    var n = parseFloat(String(text || '').replace(/[^0-9.]/g, ''));
    return isFinite(n) && n >= 0 ? n : NaN;
  }
  function fmtUpdated(ms) {
    var d = new Date(ms);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
           d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  }
  function setState(state, label, tone) {
    widget.dataset.state = state;
    widget.style.setProperty('--state-tone', tone);
    statusEl.textContent = label;
    $('.fx-widget__pill').setAttribute('aria-label', label);
  }
  function showError(msg) {
    errorEl.hidden = !msg; errorEl.textContent = msg || '';
  }

  function render() {
    var from = fromSel.value, to = toSel.value;
    pairEl.textContent = from + ' → ' + to;
    var amount = parseAmount(amountInput.value);
    if (isNaN(amount)) {
      showError('Enter an amount in numbers, for example 10,000.');
      leadEl.textContent = 'Enter an amount in ' + from;
      resultEl.textContent = '—';
    } else {
      showError('');
      leadEl.textContent = fmtAmount(amount, from) + ' ' + from + ' converts to';
    }
    if (!table) { if (!isNaN(amount)) resultEl.textContent = '…'; return; }
    var rf = table.rates[from], rt = table.rates[to];
    if (!rf || !rt) {
      showError('No rate available for ' + from + ' → ' + to + ' in today’s feed.');
      resultEl.textContent = '—'; rateEl.textContent = '—';
      return;
    }
    var rate = rt / rf;
    if (!isNaN(amount)) resultEl.textContent = fmtAmount(amount * rate, to) + ' ' + to;
    rateEl.textContent = '1 ' + from + ' = ' + fmtRate(rate) + ' ' + to;
    updatedEl.textContent = fmtUpdated(table.updated) + (table.snapshot ? ' · reference table' : '');
  }

  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!c || !c.rates || !c.updated || Date.now() - c.updated > CACHE_MAX_AGE) return null;
      return { rates: c.rates, updated: c.updated, cached: true };
    } catch (e) { return null; }
  }
  function writeCache(t) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: t.rates, updated: t.updated })); } catch (e) {}
  }
  function applyTable(t) {
    table = t;
    if (t.snapshot) setState('snapshot', 'Reference rates', 'var(--voltage-lime)');
    else setState(t.cached ? 'cached' : 'live', t.cached ? 'Cached rates' : 'Live · mid-market', t.cached ? 'var(--voltage-lime)' : 'var(--mint-glass)');
    render();
  }
  function fetchFeed(i) {
    if (i >= FEEDS.length) return Promise.reject(new Error('No feed reachable'));
    var feed = FEEDS[i];
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 7000);
    return fetch(feed.url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { var t = feed.parse(data); if (!t || !t.rates || !t.rates.USD) throw new Error('Bad feed'); return t; })
      .catch(function () { return fetchFeed(i + 1); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function load() {
    fetchFeed(0)
      .then(function (t) { t.cached = false; writeCache(t); applyTable(t); showError(''); })
      .catch(function () {
        if (!table) applyTable({ rates: SNAPSHOT.rates, updated: SNAPSHOT.updated, snapshot: true });
        /* otherwise keep the cached or reference table that is already showing */
      });
  }

  amountInput.addEventListener('input', render);
  amountInput.addEventListener('blur', function () {
    var n = parseAmount(amountInput.value);
    if (!isNaN(n)) amountInput.value = fmtAmount(n, fromSel.value);
  });
  fromSel.addEventListener('change', render);
  toSel.addEventListener('change', render);
  $('.fx-widget__swap').addEventListener('click', function () {
    var f = fromSel.value; fromSel.value = toSel.value; toSel.value = f;
    fromSel._fxRefresh(); toSel._fxRefresh();
    render();
  });
  $('.fx-widget__form').addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var cached = readCache();
  applyTable(cached || { rates: SNAPSHOT.rates, updated: SNAPSHOT.updated, snapshot: true });
  load();
  setInterval(load, 6 * 60 * 60 * 1000);
})();

/* Toniva hero: a dotted sphere whose upper arc rises across the banner. Rotates slowly,
   ripples around the pointer, and reveals the market under the cursor. No dependencies. */
(function () {
  'use strict';
  var canvas = document.getElementById('hero-arc');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Currencies shown on the coverage section. Each owns a longitude band on the sphere.
  var MARKETS = [
    ['USD', 'US dollar', '$'], ['EUR', 'Euro', '\u20ac'], ['GBP', 'British pound', '\u00a3'],
    ['SAR', 'Saudi riyal', '\u0631.\u0633'], ['AED', 'UAE dirham', '\u062f.\u0625'], ['KWD', 'Kuwaiti dinar', '\u062f.\u0643'], ['QAR', 'Qatari riyal', '\u0631.\u0642'], ['BHD', 'Bahraini dinar', '\u062f.\u0628'], ['OMR', 'Omani rial', '\u0631.\u0639.'],
    ['EGP', 'Egyptian pound', '\u062c.\u0645'], ['NGN', 'Nigerian naira', '\u20a6'], ['KES', 'Kenyan shilling', 'KSh'], ['GHS', 'Ghanaian cedi', '\u20b5'], ['ZAR', 'South African rand', 'R'],
    ['INR', 'Indian rupee', '\u20b9'], ['PHP', 'Philippine peso', '\u20b1'], ['IDR', 'Indonesian rupiah', 'Rp'], ['MYR', 'Malaysian ringgit', 'RM'], ['THB', 'Thai baht', '\u0e3f'],
    ['BRL', 'Brazilian real', 'R$'], ['MXN', 'Mexican peso', '$'], ['COP', 'Colombian peso', '$'], ['CLP', 'Chilean peso', '$']
  ];
  var BANDS = MARKETS.length;

  // Points on the upper cap of the sphere only (that is all that shows), front and back.
  var N = 6500, pts = [];
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (var i = 0; i < N; i++) {
    var y = 0.12 + rnd() * 0.88, a = rnd() * Math.PI * 2;
    var rr = Math.sqrt(1 - y * y);
    var spark = rnd() < 0.06;
    pts.push({ x: Math.cos(a) * rr, y: y, z: Math.sin(a) * rr, lon: a / (2 * Math.PI), off: 0, vel: 0, size: (spark ? 2.2 : 1.2) + rnd() * 1.4, alpha: (spark ? 0.85 : 0.4) + rnd() * 0.45, spark: spark });
  }

  var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
  function resize() {
    var b = canvas.parentNode.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(b.width)); H = Math.max(1, Math.round(b.height));
    canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // Sphere centred below the banner so only its upper cap shows, spanning the full width.
    var wide = W >= 900;
    R = wide ? Math.max(W * 0.72, H * 1.15) : Math.max(W * 0.85, H * 0.5);
    cx = wide ? W * 0.62 : W / 2;
    cy = (wide ? H * 0.1 : H * 0.72) + R;    // crest high near the centre so the arc sweeps up from the lower left
  }

  var pointer = { x: -1e4, y: -1e4, active: false, band: -1, lx: 0, ly: 0 };
  var hero = canvas.parentNode.parentNode;
  hero.addEventListener('pointermove', function (e) {
    var b = canvas.getBoundingClientRect(); pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; pointer.active = true;
  });
  hero.addEventListener('pointerleave', function () { pointer.active = false; pointer.x = -1e4; pointer.y = -1e4; });

  var TILT = 0.28, spin = 0, last = 0;
  function frame(t) {
    var dt = last ? Math.min(40, t - last) : 16; last = t;
    if (!reduced) spin += dt * 2 * Math.PI / 110000;             // one revolution every 110 s
    ctx.clearRect(0, 0, W, H);
    var gx = cx, gy = cy - R;                                  // crest point
    var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 0.75);
    glow.addColorStop(0, 'rgba(145,236,205,0.16)'); glow.addColorStop(0.45, 'rgba(67,232,255,0.05)'); glow.addColorStop(1, 'rgba(2,8,6,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    var cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(TILT), st = Math.sin(TILT);
    var nearest = -1, nearestD = 48 * 48, hoverBand = -1;
    var bandOf = new Array(N);

    // First pass: project, find the dot under the pointer.
    var proj = new Array(N);
    for (var i = 0; i < N; i++) {
      var p = pts[i];
      var x = p.x * cs + p.z * sn, z = -p.x * sn + p.z * cs, y = p.y;
      var y2 = y * ct - z * st, z2 = y * st + z * ct;
      var sx = cx + x * R, sy = cy - y2 * R;
      if (sy > H + 10 || sy < -10) { proj[i] = null; continue; }
      proj[i] = [sx, sy, z2, x, y2];
      bandOf[i] = Math.floor(((p.lon + spin / (2 * Math.PI)) % 1 + 1) % 1 * BANDS);
      if (z2 > 0.05) { var dx = sx - pointer.x, dy = sy - pointer.y, d2 = dx * dx + dy * dy; if (d2 < nearestD) { nearestD = d2; nearest = i; } }
    }
    hoverBand = (pointer.active && nearest >= 0) ? bandOf[nearest] : -1;
    pointer.band = hoverBand;

    // Second pass: ripple physics and draw.
    for (i = 0; i < N; i++) {
      var q = proj[i]; if (!q) continue;
      p = pts[i]; var front = q[2] >= 0;
      var ddx = q[0] - pointer.x, ddy = q[1] - pointer.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
      var target = pointer.active && front && dd < 170 ? Math.cos(dd / 170 * Math.PI / 2) * 26 : 0;  // lift dots near the pointer
      if (!reduced) { p.vel += (target - p.off) * 0.14 - p.vel * 0.22; p.off += p.vel; }
      // lifted dots move outward along the sphere normal
      var lift = p.off / R;
      var sx2 = cx + q[3] * R * (1 + lift), sy2 = cy - q[4] * R * (1 + lift);
      var depth = front ? 0.75 + 0.25 * q[2] : 0.28 + 0.2 * (1 + q[2]);
      var inBand = hoverBand >= 0 && bandOf[i] === hoverBand;
      var s = p.size * (inBand ? 1.35 : 1) + Math.min(2, p.off / 12);
      ctx.fillStyle = inBand ? 'rgba(221,251,101,' + (front ? 0.95 : 0.35) + ')' : (p.spark ? 'rgba(200,245,228,' + (p.alpha * depth) + ')' : 'rgba(168,206,196,' + (p.alpha * depth) + ')');
      ctx.fillRect(sx2 - s / 2, sy2 - s / 2, s, s);
    }

    // Market readout near the pointer.
    if (hoverBand >= 0 && pointer.active) {
      pointer.lx += (pointer.x - pointer.lx) * 0.25; pointer.ly += (pointer.y - pointer.ly) * 0.25;
      var m = MARKETS[hoverBand], lx = pointer.lx + 18, ly = pointer.ly;
      var big = '700 14px "Roboto", "Segoe UI", Arial, sans-serif';
      ctx.font = big; ctx.textBaseline = 'middle';
      var wSym = ctx.measureText(m[2]).width, pw = wSym + 18;
      ctx.fillStyle = 'rgba(2,8,6,0.84)'; ctx.beginPath(); ctx.roundRect(lx - 9, ly - 13, pw, 26, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(221,251,101,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(221,251,101,0.98)'; ctx.fillText(m[2], lx, ly);
      ctx.beginPath(); ctx.moveTo(pointer.lx + 7, pointer.ly); ctx.lineTo(lx - 9, pointer.ly); ctx.strokeStyle = 'rgba(221,251,101,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(pointer.lx, pointer.ly, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(221,251,101,1)'; ctx.fill();
    } else { pointer.lx = pointer.x; pointer.ly = pointer.y; }
  }

  var raf = null, running = false;
  function loop(t) { frame(t); raf = requestAnimationFrame(loop); }
  function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
  function relayout() { resize(); if (!running) frame(0); }
  resize(); window.addEventListener('resize', relayout); window.addEventListener('load', relayout);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(hero);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(canvas); else start();
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
