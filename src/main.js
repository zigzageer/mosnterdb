import '@fontsource/anton/latin-400.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/dm-sans/latin-400.css';
import { catalog, families, filterCatalog } from './catalog.js';
import './style.css';

const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const claw = '<span class="claw" aria-hidden="true"><i></i><i></i><i></i></span>';
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = 'monsterdb.collection.v1';
let saved = [];
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(value)) saved = [...new Set(value.filter(id => catalog.some(c => c.id === id)))];
} catch { storageAvailable = false; }
const state = { query: '', family: 'All', photos: false, collection: false, sort: 'shelf', saved };
let lastFocus;
let currentCan;
let toastTimer;

const photoCount = catalog.filter(c => c.image).length;
const heroCan = id => catalog.find(c => c.id === id);
const sparkle = '<svg class="chrome-star" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="chrome" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".4" stop-color="#5c5c5c"/><stop offset=".5" stop-color="#fff"/><stop offset=".75" stop-color="#747474"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="m50 0 8 34 27-19-19 27 34 8-34 8 19 27-27-19-8 34-8-34-27 19 19-27L0 50l34-8-19-27 27 19Z" fill="url(#chrome)" stroke="#eee" stroke-width=".4"/></svg>';

document.querySelector('#app').innerHTML = `
  <div class="topline"><span>INDEPENDENT. UNFILTERED. UNLEASHED.</span><span>FAN-MADE ARCHIVE <span class="ticker-star">✳</span> EST. 2026</span></div>
  <header class="header">
    <a class="brand" href="#" aria-label="MonsterDB home">${claw}<span>MONSTER<span class="brand-db">//DB</span><small>THE UNOFFICIAL CAN ARCHIVE</small></span></a>
    <nav aria-label="Main navigation"><button class="nav-link active" data-view="archive" aria-current="page">THE ARCHIVE <span>↗</span></button><button class="nav-link" data-view="collection">My collection <span class="count collection-count">${saved.length}</span></button></nav>
    <button class="about-button" id="about" aria-label="About the archive">${icon('info')}<span>THE LOWDOWN</span></button>
  </header>
  <main>
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-grid" aria-hidden="true"></div><div class="hero-scratch" aria-hidden="true"></div>
      <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> COLLECTORS, MISFITS &amp; CAFFEINE FIENDS</div>
      <h1 id="page-title">UNLEASH<br>THE <em>OBSESSION.</em></h1>
      <p>Some people see an empty can.<br>We see a collection waiting to happen.</p>
      <button class="hero-cta" id="explore">ENTER THE ARCHIVE ${icon('arrow')}</button>
      <div class="hero-meta"><span>${catalog.length} FLAVORS. ZERO CHILL.</span><span>SCROLL TO DISCOVER ↓</span></div></div>
      <div class="hero-art"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="hero-cross cross-one">+</span><span class="hero-cross cross-two">+</span><span class="hero-word" aria-hidden="true">MONSTER</span>
        ${['zero-ultra','original-green','mango-loco'].map((id,i) => `<button class="hero-can hero-can-${i}" data-detail="${id}" aria-label="Featured ${heroCan(id).name}"><img src="${heroCan(id).image}" alt="${heroCan(id).name} can" fetchpriority="${i===1?'high':'auto'}"/></button>`).join('')}
        ${sparkle}<div class="hero-sticker">CAUTION<br><strong>HIGHLY<br>COLLECTIBLE</strong><span>HANDLE WITH OBSESSION</span></div>
        <span class="hero-art-caption">THE CLASSICS NEVER DIE. // 001—003</span>
      </div>
    </section>
    <div class="noise-tape" aria-hidden="true"><div>${Array.from({length:4},()=>'<span>HUNT THE FLAVOR.</span><span class="tape-star">✳</span><span>KEEP THE CAN.</span><span class="tape-star">✳</span>').join('')}</div></div>
    <section class="catalog-section" id="catalog" aria-labelledby="catalog-title">
      <div class="catalog-title-row"><div><div class="eyebrow">// OPEN THE VAULT</div><h2 id="catalog-title">PICK YOUR <em>POISON.</em></h2></div><div class="catalog-stats"><strong>${String(catalog.length).padStart(3,'0')}</strong><span>FLAVORS INDEXED<br><b>${photoCount} REAL CAN PHOTOS</b></span></div></div>
      <div class="catalog-panel">
        <div class="toolbar"><label class="search">${icon('search')}<input id="search" type="search" placeholder="SEARCH THE MADNESS…" autocomplete="off" aria-label="Search cans"/><kbd>/</kbd></label><div class="toolbar-right"><label class="photo-toggle"><input id="photos" type="checkbox"/><span class="switch" aria-hidden="true"></span> Photos only</label><label class="sort-label">SORT <select id="sort" aria-label="Sort cans"><option value="shelf">Archive order</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option></select></label></div></div>
        <div class="family-bar"><div class="family-tabs" role="group" aria-label="Filter by family"><button class="family-tab active" data-family="All" aria-pressed="true">ALL CANS <span>${catalog.length}</span></button>${families.map(f=>`<button class="family-tab" data-family="${f}" aria-pressed="false">${f}</button>`).join('')}</div></div>
        <div class="results-bar"><span id="result-summary" role="status"></span><span>HIT + TO CLAIM YOUR CAN ${icon('plus')}</span></div>
        <div id="grid" class="can-grid"></div><div id="empty" class="empty" hidden></div>
      </div>
    </section>
    <section class="collector-banner"><div><span class="eyebrow">IT'S MORE THAN A DRINK.</span><h2>IT'S A WHOLE<br><em>PERSONALITY.</em></h2></div><div><p>The weird ones. The hard-to-find ones. The one you bought on a road trip. Keep them all in one place.</p><button class="hero-cta" data-view="collection">BUILD YOUR COLLECTION ${icon('arrow')}</button></div><span class="banner-star" aria-hidden="true">✳</span></section>
    <footer><a class="brand" href="#" aria-label="MonsterDB home">${claw}<span>MONSTER<span class="brand-db">//DB</span></span></a><div><span>MADE BY FANS. FOR THE OBSESSED.</span><p>A growing independent archive. Not affiliated with Monster Energy.<br>Regional editions and historical releases are still being documented.</p></div><button id="back-top">BACK TO THE TOP ${icon('arrow')}</button></footer>
  </main>
  <dialog id="detail" aria-labelledby="detail-title"></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><button class="close-dialog" aria-label="Close about dialog">${icon('close')}</button><div class="eyebrow">THE UNOFFICIAL CAN ARCHIVE</div><h2 id="about-title">EVERY CAN HAS<br><em>A STORY.</em></h2><p>MonsterDB is for the people who keep the empty can. Discover flavors, revisit the classics, and make a collection of your own.</p><div class="about-facts"><span><strong>${catalog.length}</strong> flavors indexed</span><span><strong>${photoCount}</strong> real can photos</span></div><h3>STILL HUNTING.</h3><p>This archive is growing. Regional editions, packaging redesigns, release dates, and availability need further verification. It is not yet a complete history of every Monster ever made.</p><p>Photos are sourced from public product catalogs and showcase datasets, with provenance recorded in the project. Missing photos are clearly marked. Product imagery and trademarks belong to their owners.</p><h3>YOUR CANS. YOUR BROWSER.</h3><p>Your saved collection stays in this browser. No account needed. Clearing browser data resets your collection.</p><a class="source-link" href="https://www.monsterenergy.com/en-us/energy-drinks/" target="_blank" rel="noreferrer">OFFICIAL MONSTER LINEUP ${icon('arrow')}</a></dialog>
  <div id="toast" role="status" aria-live="polite"></div>
`;

function canVisual(can) {
  if (can.image) return `<img class="can-photo" src="${can.image}" alt="${escape(can.name)} can" loading="lazy" decoding="async"/>`;
  return `<div class="ghost-can" role="img" aria-label="Photo missing for ${escape(can.name)}"><span class="ghost-top"></span>${claw}<strong>PHOTO<br>WANTED.</strong><small>THE HUNT CONTINUES</small></div>`;
}

function collectionButton(can, modal = false) {
  const added = saved.includes(can.id);
  return `<button class="${modal ? 'collect-main' : 'collect-button'} ${added ? 'is-saved' : ''}" data-collect="${can.id}" aria-label="${added ? 'Remove' : 'Add'} ${escape(can.name)} ${added ? 'from' : 'to'} collection" aria-pressed="${added}">${icon(added ? 'check' : 'plus')}${modal ? (added ? 'In your collection' : 'Add to my collection') : ''}</button>`;
}

function renderGrid() {
  state.saved = saved;
  const cans = filterCatalog(state);
  document.querySelector('#result-summary').textContent = `${String(cans.length).padStart(2, '0')} CANS FOUND${state.collection ? ' // YOUR COLLECTION' : ' // THE ARCHIVE'}`;
  document.querySelector('#grid').innerHTML = cans.map(can => `<article class="can-card ${can.image ? '' : 'missing-photo'}" style="--can-color:${can.color}">
    <div class="card-top"><span class="serial">M//${can.number}</span>${collectionButton(can)}</div>
    <button class="can-display" data-detail="${can.id}" aria-label="View ${escape(can.name)} details"><span class="card-orbit" aria-hidden="true"></span><span class="card-watermark" aria-hidden="true">${escape(can.family)}</span>${canVisual(can)}<span class="stage-caption">${can.image ? 'THE REAL DEAL' : 'PHOTO NOT YET SOURCED'} // ${can.number}</span></button>
    <button class="can-label" data-detail="${can.id}" aria-label="Details for ${escape(can.name)}"><span class="family-label"><i></i>${can.family === 'Juiced' ? 'JUICED / PUNCH' : can.family.toUpperCase()}</span><h2>${escape(can.name)}</h2><p>${escape(can.flavor)}</p><span class="label-arrow">${icon('arrow')}</span></button>
  </article>`).join('');
  const empty = document.querySelector('#empty');
  empty.hidden = cans.length > 0;
  empty.innerHTML = `${icon('grid')}<h2>${state.collection && !saved.length ? 'YOUR COLLECTION STARTS HERE.' : 'NOTHING IN THE VAULT.'}</h2><p>${state.collection && !saved.length ? 'Hit + on a can in the archive to make it yours.' : 'Try another flavor or clear your filters. There are plenty more cans to find.'}</p><button id="reset" class="collect-main">${state.collection ? 'Explore the archive' : 'Reset filters'} ${icon('arrow')}</button>`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function toggleCollection(id) {
  const can = catalog.find(c => c.id === id);
  const added = !saved.includes(id);
  saved = added ? [...saved, id] : saved.filter(c => c !== id);
  try { localStorage.setItem(key, JSON.stringify(saved)); storageAvailable = true; } catch { storageAvailable = false; }
  const focusedId = document.activeElement?.dataset.collect;
  const returnId = lastFocus?.dataset.detail;
  renderGrid();
  if (returnId) lastFocus = document.querySelector(`[data-detail="${returnId}"]`);
  document.querySelector('.collection-count').textContent = saved.length;
  if (currentCan && document.querySelector('#detail').open) renderDetail(currentCan);
  if (focusedId) {
    const target = document.querySelector('#detail').open ? document.querySelector('#detail [data-collect]') : document.querySelector(`[data-collect="${focusedId}"]`);
    target?.focus({ preventScroll: true });
  }
  showToast(storageAvailable ? `${can.name} ${added ? 'added to' : 'removed from'} your collection` : 'Collection updated for this visit. Browser storage is unavailable.');
}

function renderDetail(can) {
  document.querySelector('#detail').innerHTML = `<button class="close-dialog" aria-label="Close can details">${icon('close')}</button><div class="detail-visual" style="--can-color:${can.color}"><span class="detail-serial">M//${can.number} — ARCHIVE ENTRY</span><span class="card-orbit"></span>${canVisual(can)}</div><div class="detail-copy"><div class="eyebrow">${can.family.toUpperCase()} // MONSTER ARCHIVE</div><h2 id="detail-title">${escape(can.name)}</h2><p class="detail-flavor">${escape(can.flavor)}</p><div class="detail-divider"></div><p>${can.image ? 'One more for the collection. Claim this can and keep your personal lineup in one place.' : 'Still hunting for this one. A sourced photo of the packaging has not been added yet.'}</p><dl><div><dt>FAMILY</dt><dd>${can.family}</dd></div><div><dt>ARTWORK</dt><dd>${can.image ? 'Product photo' : 'Photo wanted'}</dd></div></dl>${collectionButton(can, true)}<a class="source-link" href="${can.source}" target="_blank" rel="noreferrer">${can.source.endsWith('/energy-drinks/') ? 'OFFICIAL MONSTER CATALOG' : 'VIEW PRODUCT SOURCE'} ${icon('arrow')}</a><small class="detail-note">Packaging and availability vary by region. An archive entry does not confirm current production.</small></div>`;
}

function openDialog(dialog) {
  lastFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

function setView(collection) {
  state.collection = collection;
  document.querySelectorAll('[data-view]').forEach(b => {
    const active = (b.dataset.view === 'collection') === collection;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  document.querySelector('#page-title').innerHTML = collection ? 'YOUR CANS.<br><em>YOUR RULES.</em>' : 'UNLEASH<br>THE <em>OBSESSION.</em>';
  renderGrid();
}

document.addEventListener('click', event => {
  const collect = event.target.closest('[data-collect]');
  if (collect) return toggleCollection(collect.dataset.collect);
  const detail = event.target.closest('[data-detail]');
  if (detail) {
    currentCan = catalog.find(c => c.id === detail.dataset.detail);
    renderDetail(currentCan);
    return openDialog(document.querySelector('#detail'));
  }
  const family = event.target.closest('[data-family]');
  if (family) {
    state.family = family.dataset.family;
    document.querySelectorAll('[data-family]').forEach(b => { b.classList.toggle('active', b === family); b.setAttribute('aria-pressed', b === family); });
    return renderGrid();
  }
  const view = event.target.closest('[data-view]');
  if (view) { setView(view.dataset.view === 'collection'); if (view.closest('.collector-banner')) document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth' }); return; }
  if (event.target.closest('#explore')) return document.querySelector('#catalog').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (event.target.closest('.brand')) { event.preventDefault(); reset(); return; }
  if (event.target.closest('#reset')) return reset();
  if (event.target.closest('#about')) return openDialog(document.querySelector('#about-dialog'));
  if (event.target.closest('.close-dialog')) return event.target.closest('dialog').close();
  if (event.target.closest('#back-top')) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

function reset() {
  Object.assign(state, { query: '', family: 'All', photos: false, sort: 'shelf' });
  document.querySelector('#search').value = '';
  document.querySelector('#photos').checked = false;
  document.querySelector('#sort').value = 'shelf';
  document.querySelectorAll('[data-family]').forEach(b => { const active = b.dataset.family === 'All'; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
  setView(false);
}
document.querySelector('#search').addEventListener('input', e => { state.query = e.target.value; renderGrid(); });
document.querySelector('#photos').addEventListener('change', e => { state.photos = e.target.checked; renderGrid(); });
document.querySelector('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
document.addEventListener('keydown', e => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); document.querySelector('#search').focus(); }
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    currentCan = null;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    else document.querySelector('.nav-link.active').focus({ preventScroll: true });
  });
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    }
  });
});
renderGrid();
