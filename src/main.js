import '@fontsource/tomorrow/latin-700-italic.css';
import '@fontsource/tomorrow/latin-900-italic.css';
import '@fontsource/barlow-condensed/latin-800-italic.css';
import '@fontsource/barlow-condensed/latin-900-italic.css';
import '@fontsource/chakra-petch/latin-500.css';
import '@fontsource/chakra-petch/latin-700.css';
import '@fontsource/new-rocker/latin-400.css';
import '@fontsource/sedgwick-ave-display/latin-400.css';
import { catalog, families, familyLivery, filterCatalog } from './catalog.js';
import { TRACKING_KEY, normalizeProfile, sameProfile, trackingHash, trackingLink, readTrackingHash } from './tracking.js';
import { makeShareCard } from './share-card.js';
import { clawMark, heroRip, sparkle, spinBadge, barcode, cardStrike, tach } from './art.js';
import './style.css';

const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  check: '<path d="m4 12.5 5 5L20 6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  up: '<path d="M12 20V5m-6 6 6-6 6 6"/>',
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  star: '<path d="m12 2.6 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.3-5.9 3.3 1.2-6.6-4.8-4.6 6.6-.9Z"/>',
  share: '<path d="M12 15V3m-4.5 4.5L12 3l4.5 4.5M5 12v8h14v-8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>',
  target: '<circle cx="12" cy="12" r="7.5"/><path d="M12 1.5V7M12 17v5.5M1.5 12H7M17 12h5.5"/>',
  crate: '<path d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 4.6l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  undo: '<path d="M4 9h10a6 6 0 0 1 0 12H8M4 9l5-5M4 9l5 5"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${icons[name]}</svg>`;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Chunky sticker lettering: an outlined copy sits behind the filled copy.
const chunk = (text, cls = '') => `<span class="chunk ${cls}"><span class="chunk-stroke" aria-hidden="true">${text}</span><span class="chunk-fill">${text}</span></span>`;
const plate = can => `<span class="plate" aria-hidden="true"><small>No.</small>${can.number}</span>`;
const instant = { behavior: 'instant' };

const key = 'monsterdb.collection.v1';
let saved = [];
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(value)) saved = [...new Set(value.filter(id => catalog.some(c => c.id === id)))];
} catch { storageAvailable = false; }
let tracker = normalizeProfile();
let trackerStorageAvailable = true;
try { tracker = normalizeProfile(JSON.parse(localStorage.getItem(TRACKING_KEY) || '{}')); } catch { trackerStorageAvailable = false; }
const incomingTracker = readTrackingHash(location.hash);
let sharedTracker = incomingTracker?.profile && !sameProfile(incomingTracker.profile, tracker) ? incomingTracker.profile : null;
let shareArtifact;
let shareVersion = 0;
let shareTimer;

const state = { view: 'archive', triedFilter: 'all', query: '', family: 'All', photos: false, collection: false, sort: 'shelf', saved };
let visibleCans = catalog;
let currentCan;
let pickMode = false;
let restoreFocus;
let toastTimer;
let toastUndo;
let lastRatio;
let bannerFor;

const photoCount = catalog.filter(c => c.image).length;
const heroCan = id => catalog.find(c => c.id === id);
const familyCans = Object.fromEntries([['All', catalog], ...families.map(family => [family, catalog.filter(can => can.family === family)])]);
const familyName = family => family === 'Juiced' ? 'Juiced / Punch' : family;

// Progress ranks. The last one always needs the full catalog.
const ranks = [[0, 'Fresh meat'], [1, 'Rookie'], [10, 'Amateur'], [25, 'Pro'], [50, 'Factory rider'], [75, 'Beast mode'], [catalog.length, 'Legend']];
function rankFor(count) {
  let index = 0;
  ranks.forEach(([needed], i) => { if (count >= needed) index = i; });
  return { name: ranks[index][1], next: ranks[index + 1] };
}

const tickerWords = ['Unleash the obsession', `${catalog.length} flavors`, 'Zero chill', 'Fan-made archive', 'Hunt the flavor', 'Keep the can', 'Not affiliated with Monster Energy'];
const tapeWords = ['Hunt the flavor', 'Keep the can', 'Rate it', 'Flex the list'];

document.querySelector('#app').innerHTML = `
  <svg class="defs" width="0" height="0" aria-hidden="true"><defs>
    <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".38" stop-color="#7d868c"/><stop offset=".5" stop-color="#fff"/><stop offset=".72" stop-color="#8a9399"/><stop offset="1" stop-color="#fff"/></linearGradient>
  </defs></svg>
  <a class="skip-link" href="#catalog">Skip to the cans</a>
  <div class="ticker" aria-hidden="true"><div class="ticker-track">${Array.from({length:4}, () => tickerWords.map(word => `<span>${word}</span><i></i>`).join('')).join('')}</div></div>
  <header class="header">
    <a class="brand" href="#" aria-label="MonsterDB home">${clawMark}<span class="brand-word"><span class="brand-name">Monster</span><span class="brand-db">//DB</span></span><small>The unofficial can archive</small></a>
    <nav aria-label="Main navigation">
      <button class="nav-link active" data-view="archive" aria-current="page">${icon('grid')}<span class="nav-label" data-short="Archive">The archive</span></button>
      <button class="nav-link" data-view="tracker">${icon('check')}<span class="nav-label" data-short="Tried">My tried list</span> <span class="count tried-count">${tracker.tried.length}</span></button>
      <button class="nav-link" data-view="left">${icon('target')}<span class="nav-label" data-short="To try">Left to try</span> <span class="count left-count">${catalog.length - tracker.tried.length}</span></button>
      <button class="nav-link" data-view="collection">${icon('crate')}<span class="nav-label" data-short="Collection">My collection</span> <span class="count collection-count">${saved.length}</span></button>
    </nav>
    <button class="about-button" id="about" aria-label="About the archive">${icon('info')}<span>The lowdown</span></button>
  </header>
  <main>
    <div class="shared-banner" id="shared-banner" hidden></div>
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="kicker"><span>Fan-made</span><span>Unofficial</span><span>Est. 2026</span></p>
        <h1 id="page-title">${chunk('Unleash')} <span class="h1-goth">the</span> ${chunk('Obsession.', 'chunk-chrome')}</h1>
        <p class="hero-sub">Some people see an empty can. We see a collection waiting to happen. Tick off every flavor you have tried, rate them, and flex the list.</p>
        <div class="hero-ctas">
          <button class="btn btn-primary" id="explore">Enter the archive ${icon('arrow')}</button>
          <button class="btn btn-ghost" data-pick-next>${icon('dice')} Surprise me</button>
        </div>
        <ul class="hero-stats">
          <li><strong>${catalog.length}</strong><span>flavors indexed</span></li>
          <li><strong>${families.length}</strong><span>can families</span></li>
          <li class="mine"><strong class="hero-tried">${tracker.tried.length}</strong><span>tried by you</span></li>
        </ul>
      </div>
      <div class="hero-art">
        ${heroRip}
        ${['zero-ultra','original-green','mango-loco'].map((id,i) => `<button class="hero-can hero-can-${i}" data-detail="${id}" aria-label="Featured ${heroCan(id).name}"><img src="${heroCan(id).image}" alt="${heroCan(id).name} can" fetchpriority="${i===1?'high':'auto'}"/></button>`).join('')}
        ${sparkle('sparkle-a')}${sparkle('sparkle-b')}${sparkle('sparkle-c')}
        <div class="decal decal-spin" aria-hidden="true">${spinBadge(`Zero chill ✦ ${catalog.length} flavors ✦ Zero chill ✦ ${catalog.length} flavors ✦`)}</div>
        <div class="decal decal-caution" aria-hidden="true"><b>Caution</b><strong>Highly<br>collectible</strong><span>Handle with obsession</span></div>
        <span class="decal decal-tag" aria-hidden="true">the classics never die</span>
        <span class="decal decal-checker" aria-hidden="true"></span>
      </div>
    </section>
    <div class="tape" aria-hidden="true"><div class="tape-track">${Array.from({length:6}, () => tapeWords.map(word => `<span>${word}</span>${sparkle()}`).join('')).join('')}</div></div>
    <section class="tracker-panel" id="tracker-panel" aria-label="Your flavor passport"></section>
    <section class="catalog-section" id="catalog" aria-labelledby="catalog-title">
      <div class="catalog-title-row">
        <div><p class="eyebrow" id="catalog-eyebrow">Open the vault</p><h2 id="catalog-title">PICK YOUR <em>POISON.</em></h2></div>
        <div class="catalog-stats"><strong>${catalog.length}</strong><span>flavors indexed<b>${photoCount} real can photos</b></span></div>
      </div>
      <div id="filters-anchor"></div>
      <div class="filters" id="filters">
        <div class="filters-row">
          <label class="search">${icon('search')}<input id="search" type="search" placeholder="Search flavors, e.g. mango" autocomplete="off" enterkeyhint="search" aria-label="Search cans"/><kbd>/</kbd><button type="button" class="search-clear" id="search-clear" aria-label="Clear search" hidden>${icon('close')}</button></label>
          <div class="status-tabs" role="group" aria-label="Show">
            <button data-tried-filter="all" aria-pressed="true">ALL FLAVORS <span id="all-tried-count">${catalog.length}</span></button>
            <button data-tried-filter="tried" aria-pressed="false">TRIED <span id="filter-tried-count">0</span></button>
            <button data-tried-filter="left" aria-pressed="false">LEFT TO TRY <span id="filter-left-count">${catalog.length}</span></button>
            <button data-view="collection" aria-pressed="false">COLLECTION <span id="filter-collection-count">${saved.length}</span></button>
          </div>
          ${photoCount < catalog.length ? `<label class="photo-toggle"><input id="photos" type="checkbox"/><span class="switch" aria-hidden="true"></span> Photos only</label>` : ''}
          <label class="sort-label"><span>Sort</span><select id="sort" aria-label="Sort cans"><option value="shelf">Archive order</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option><option value="rating-desc">Top rated</option><option value="rating-asc">Lowest rated</option></select></label>
        </div>
        <div class="family-tabs" role="group" aria-label="Filter by family">${['All', ...families].map(family => `<button class="family-tab ${family === 'All' ? 'active' : ''}" data-family="${family}" aria-pressed="${family === 'All'}" aria-label="${family === 'All' ? 'All cans' : family}" style="--fam:${familyLivery[family] || '#f3f2e7'}"><i class="dot"></i><span>${family === 'All' ? 'All cans' : family}</span><b class="fam-count">${familyCans[family].length}</b><span class="fam-bar"><i></i></span></button>`).join('')}</div>
      </div>
      <div class="results-bar"><span id="result-summary" role="status"></span><button type="button" id="clear-filters" hidden>Clear filters ${icon('close')}</button></div>
      <div id="grid" class="can-grid"></div><div id="empty" class="empty" hidden></div>
    </section>
    <section class="collector-banner">
      <div class="banner-copy"><p class="eyebrow">It's more than a drink.</p><h2>It's a whole <em>personality.</em></h2></div>
      <div class="banner-side"><p>The weird ones. The hard-to-find ones. The one you bought on a road trip at 2 a.m. Keep the cans you own in one place, separate from your tried list.</p><button class="btn btn-primary" data-view="collection">Build your collection ${icon('arrow')}</button></div>
      ${clawMark}
    </section>
    <footer class="footer">
      <div class="footer-top"><a class="brand" href="#" aria-label="MonsterDB home">${clawMark}<span class="brand-word"><span class="brand-name">Monster</span><span class="brand-db">//DB</span></span><small>Made by fans. For the obsessed.</small></a><button class="btn btn-ghost" id="back-top">Back to the top ${icon('up')}</button></div>
      <ul class="decal-row" aria-hidden="true">${families.map(family => `<li style="--fam:${familyLivery[family]}">${family}</li>`).join('')}</ul>
      <div class="footer-fine">${barcode(9)}<p>A growing independent archive. Not affiliated with Monster Energy. Regional editions and historical releases are still being documented. Product imagery and trademarks belong to their owners.</p></div>
    </footer>
  </main>
  <dialog id="detail" aria-labelledby="detail-title"></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title">
    <button class="close-dialog" aria-label="Close about dialog">${icon('close')}</button>
    <p class="eyebrow">The unofficial can archive</p>
    <h2 id="about-title">EVERY CAN HAS<br><em>A STORY.</em></h2>
    <p>MonsterDB is for the people who keep the empty can. Discover flavors, revisit the classics, and build a list of your own.</p>
    <div class="facts"><h3>Archive facts</h3><p>Serving size: 1 browser tab</p><dl>
      <div><dt>Flavors indexed</dt><dd>${catalog.length}</dd></div>
      <div><dt>Real can photos</dt><dd>${photoCount}</dd></div>
      <div><dt>Can families</dt><dd>${families.length}</dd></div>
      <div><dt>Accounts required</dt><dd>0</dd></div>
      <div><dt>Cookies and trackers</dt><dd>0</dd></div>
    </dl></div>
    <h3>How it works.</h3>
    <ul class="how"><li><b>Tried list</b> Every flavor you have tasted. Hit “Mark as tried” on a can, or just rate it and it is marked for you.</li><li><b>Left to try</b> Everything still on your hit list. It shrinks as you go.</li><li><b>Collection</b> Cans you own or keep. It is separate from tried, so a can can be in both.</li><li><b>Share card</b> One PNG with every tried can, your ratings and a QR code that opens your exact list.</li></ul>
    <h3>Your cans. Your browser.</h3>
    <p>Your collection and tried list save automatically in this browser. No account needed. Copy your personal tracking link to keep a snapshot or open it on another device. Opening someone else’s link previews their list without replacing yours. Each link captures the progress at the time it was copied, so copy a fresh one after updates.</p>
    <h3>Still hunting.</h3>
    <p>This archive is growing. Regional editions, packaging redesigns, release dates and availability need further verification. It is not yet a complete history of every Monster ever made.</p>
    <p>Photos are sourced from public product catalogs and showcase datasets, with provenance recorded in the project. Product imagery and trademarks belong to their owners.</p>
    <a class="source-link" href="https://www.monsterenergy.com/en-us/energy-drinks/" target="_blank" rel="noreferrer">Official Monster lineup ${icon('arrow')}</a>
  </dialog>
  <dialog id="share-dialog" aria-labelledby="share-title">
    <button class="close-dialog" aria-label="Close share card">${icon('close')}</button>
    <div class="share-editor">
      <p class="eyebrow">Your taste. Loud and proud.</p>
      <h2 id="share-title">MAKE IT <em>SHAREABLE.</em></h2>
      <label class="card-name-label">NAME ON YOUR CARD (OPTIONAL)<input id="card-name" type="text" maxlength="28" autocomplete="nickname" placeholder="Your name"/></label>
      <p>Every tried can on one graphic, with your star ratings beside each can. The QR code opens this exact list.</p>
      <div id="share-status" role="status">Building your card…</div>
      <div class="share-actions"><button class="btn btn-primary" id="download-png" disabled>${icon('share')} Download PNG</button><button class="btn btn-ghost" id="native-share" hidden>Share image</button><button class="btn btn-ghost" id="copy-share-link">${icon('link')} Copy personal link</button><button class="btn btn-ghost" id="retry-card" hidden>Retry card</button></div>
      <label class="share-link-label">YOUR PERSONAL TRACKING LINK<input id="share-link" type="text" readonly aria-label="Personal tracking link"/></label>
      <p class="share-link-note">This link holds a snapshot of your tried list. Save a fresh link after adding cans. Browser progress saves automatically.</p>
    </div>
    <div class="share-preview" id="share-preview"></div>
  </dialog>
  <div id="toast" role="status" aria-live="polite"></div>
`;

const $ = selector => document.querySelector(selector);
const grid = $('#grid');
const detailDialog = $('#detail');
const shareDialog = $('#share-dialog');
const toast = $('#toast');
const searchInput = $('#search');

function canVisual(can) {
  if (can.image) return `<img class="can-photo" src="${can.image}" alt="${escape(can.name)} can" loading="lazy" decoding="async"/>`;
  return `<div class="ghost-can" role="img" aria-label="Photo missing for ${escape(can.name)}">${clawMark}<strong>Photo<br>wanted</strong></div>`;
}

function triedButton(can, modal = false) {
  const tried = activeTracker().tried.includes(can.id);
  return `<button class="tried-toggle ${modal ? 'tried-detail' : ''} ${tried ? 'is-tried' : ''}" data-tried="${can.id}" aria-label="Mark ${escape(can.name)} as ${tried ? 'not tried' : 'tried'}" aria-pressed="${tried}" ${sharedTracker ? 'disabled title="Preview mode. Add this list to your tracker to make changes."' : ''}><span class="tick" aria-hidden="true">${tried ? icon('check') : ''}</span><span>${tried ? 'Tried it' : 'Mark as tried'}</span></button>`;
}

function ratingControls(can, modal = false) {
  const profile = activeTracker();
  const tried = profile.tried.includes(can.id);
  const rating = profile.ratings?.[can.id] || 0;
  const caption = modal ? `<div class="rating-caption"><span>${sharedTracker ? 'Their rating' : 'Your rating'}</span><strong>${rating ? `${rating}/5` : 'UNRATED'}</strong>${!tried && !sharedTracker ? '<em>Rating it marks it tried</em>' : ''}</div>` : '';
  const clear = rating && !sharedTracker ? `<button class="rating-clear" data-clear-rating="${can.id}" aria-label="Clear rating for ${escape(can.name)}" title="Clear rating">${modal ? 'Clear' : icon('close')}</button>` : '';
  return `<div class="can-rating ${rating ? 'is-rated' : ''}">${caption}<div class="rating-row"><div class="rating-stars" role="group" aria-label="Rate ${escape(can.name)}">${[1,2,3,4,5].map(value => `<button class="${value <= rating ? 'filled' : ''}" data-rate="${can.id}" data-value="${value}" tabindex="${value === (rating || 1) ? 0 : -1}" aria-label="Rate ${escape(can.name)} ${value} out of 5 stars" aria-pressed="${rating === value}" ${sharedTracker ? 'disabled' : ''}>${icon('star')}</button>`).join('')}</div>${clear}</div></div>`;
}

function collectionButton(can, modal = false) {
  const added = saved.includes(can.id);
  return `<button class="${modal ? 'collect-main' : 'collect-button'} ${added ? 'is-saved' : ''}" data-collect="${can.id}" aria-label="${added ? 'Remove' : 'Add'} ${escape(can.name)} ${added ? 'from' : 'to'} collection" aria-pressed="${added}" title="${added ? 'In your collection. Click to remove.' : 'Add to the cans you own'}">${icon(added ? 'check' : 'plus')}<span>${modal ? (added ? 'In your collection' : 'Add to my collection') : (added ? 'Owned' : 'Collect')}</span></button>`;
}

function renderGrid({ enter = false } = {}) {
  state.saved = saved;
  const selected = new Set(activeTracker().tried);
  let cans = filterCatalog(state);
  if (state.triedFilter === 'tried') cans = cans.filter(can => selected.has(can.id));
  if (state.triedFilter === 'left') cans = cans.filter(can => !selected.has(can.id));
  if (state.sort === 'rating-desc' || state.sort === 'rating-asc') {
    const ratings = activeTracker().ratings || {};
    const direction = state.sort === 'rating-desc' ? -1 : 1;
    cans.sort((a,b) => {
      const first=ratings[a.id] || 0, second=ratings[b.id] || 0;
      if (!first || !second) return first ? -1 : second ? 1 : 0;
      return direction*(first-second) || a.name.localeCompare(b.name);
    });
  }
  visibleCans = cans;
  renderTracker();
  renderFilters(cans);
  grid.classList.toggle('enter', enter);
  grid.innerHTML = cans.map((can, index) => {
    const tried = selected.has(can.id);
    return `<article class="can-card ${tried ? 'has-tried' : ''} ${saved.includes(can.id) ? 'is-saved' : ''} ${can.image ? '' : 'missing-photo'}" data-id="${can.id}" style="--can-color:${can.color};--i:${Math.min(index, 14)}">
    <div class="card-stage">
      ${plate(can)}${collectionButton(can)}
      <button class="can-display" data-detail="${can.id}" aria-label="View ${escape(can.name)} details"><span class="card-watermark" aria-hidden="true">${escape(can.family)}</span>${canVisual(can)}</button>
      ${tried ? '<span class="tried-stamp" aria-hidden="true">Tried</span>' : ''}
    </div>
    <div class="can-label" data-detail="${can.id}"><span class="family-label" style="--fam:${familyLivery[can.family]}">${familyName(can.family)}</span><h2>${escape(can.name)}</h2><p>${escape(can.flavor)}</p></div>
    <div class="card-actions">${triedButton(can)}${ratingControls(can)}</div>
  </article>`;
  }).join('');
  const empty = $('#empty');
  empty.hidden = cans.length > 0;
  if (cans.length) return;
  if (state.view === 'left' && selected.size === catalog.length) {
    empty.innerHTML = `${icon('check')}<h2>NOTHING LEFT. LEGEND STATUS.</h2><p>You have tried every flavor in this archive. Your full tried list is ready to share.</p><button class="btn btn-primary" data-view="tracker">VIEW MY TRIED LIST</button>`;
    return;
  }
  if (state.view === 'tracker' && state.triedFilter === 'tried' && !selected.size) {
    empty.innerHTML = `${icon('target')}<h2>YOUR FIRST CAN IS OUT THERE.</h2><p>Mark the flavors you have tried, then turn your list into a share card.</p><button class="btn btn-primary" data-tried-filter="left">FIND YOUR FIRST CAN</button>`;
    return;
  }
  const emptyCollection = state.collection && !saved.length;
  empty.innerHTML = `${icon(emptyCollection ? 'crate' : 'search')}<h2>${emptyCollection ? 'YOUR COLLECTION STARTS HERE.' : 'NOTHING IN THE VAULT.'}</h2><p>${emptyCollection ? 'Hit “Collect” on any can you own to park it on your shelf.' : 'No can matches that. Try another flavor or clear your filters.'}</p><button id="reset" class="btn btn-primary">${state.collection ? 'Explore the archive' : 'Reset filters'}</button>`;
}

function renderFilters(cans) {
  const selected = new Set(activeTracker().tried);
  const viewName = { archive:'the archive', tracker:sharedTracker ? 'their tried list' : 'your tried list', left:'left to try', collection:'your collection' }[state.view];
  const narrowed = [state.family !== 'All' ? familyName(state.family) : '', state.query.trim() ? `“${state.query.trim()}”` : ''].filter(Boolean);
  $('#result-summary').innerHTML = `<b>${cans.length}</b> ${cans.length === 1 ? 'can' : 'cans'} in ${viewName}${narrowed.length ? ` <span>matching ${escape(narrowed.join(' + '))}</span>` : ''}`;
  $('#clear-filters').hidden = !(state.query || state.family !== 'All' || state.photos || state.sort !== 'shelf');
  $('#search-clear').hidden = !state.query;
  $('#filter-collection-count').textContent = saved.length;
  document.querySelectorAll('.status-tabs button').forEach(button => {
    const pressed = button.dataset.view ? state.view === 'collection' : state.view !== 'collection' && button.dataset.triedFilter === state.triedFilter;
    button.setAttribute('aria-pressed', pressed);
  });
  document.querySelectorAll('.family-tab').forEach(tab => {
    const list = familyCans[tab.dataset.family];
    const done = list.filter(can => selected.has(can.id)).length;
    tab.querySelector('.fam-bar i').style.width = `${done / list.length * 100}%`;
    tab.title = `${done} of ${list.length} tried`;
  });
}

function showToast(message, undo) {
  clearTimeout(toastTimer);
  toastUndo = undo || null;
  toast.innerHTML = `<span>${escape(message)}</span>${undo ? `<button type="button" id="toast-undo">${icon('undo')} Undo</button>` : ''}`;
  // A modal dialog makes the rest of the page inert, so the toast has to live inside it.
  (document.querySelector('dialog[open]') || document.body).append(toast);
  toast.classList.add('visible');
  toastTimer = setTimeout(hideToast, undo ? 6500 : 3200);
}

function hideToast() {
  clearTimeout(toastTimer);
  toastUndo = null;
  toast.classList.remove('visible');
  toast.querySelector('button')?.remove();
}

/** Re-render after a change and put keyboard focus back where the user was. */
function refresh(focusSelector, fallback) {
  renderGrid();
  if (currentCan && detailDialog.open) renderDetail(currentCan);
  if (!focusSelector) return;
  const root = detailDialog.open ? detailDialog : grid;
  (root.querySelector(focusSelector) || (fallback && $(fallback)))?.focus({ preventScroll: true });
}

function saveCollection() {
  try { localStorage.setItem(key, JSON.stringify(saved)); storageAvailable = true; } catch { storageAvailable = false; }
  $('.collection-count').textContent = saved.length;
}

function toggleCollection(id, keepFocus = true) {
  const can = catalog.find(c => c.id === id);
  if (!can) return;
  const before = saved;
  const added = !saved.includes(id);
  saved = added ? [...saved, id] : saved.filter(c => c !== id);
  saveCollection();
  refresh(keepFocus ? `[data-collect="${id}"]` : null);
  showToast(storageAvailable ? `${can.name} ${added ? 'added to' : 'removed from'} your collection` : 'Collection updated for this visit. Browser storage is unavailable.', () => {
    saved = before;
    saveCollection();
    refresh();
    showToast(`Undone. ${can.name} is ${added ? 'off' : 'back on'} your shelf.`);
  });
}

function renderDetail(can) {
  const list = visibleCans.some(item => item.id === can.id) ? visibleCans : catalog;
  const position = list.findIndex(item => item.id === can.id) + 1;
  const tried = activeTracker().tried.includes(can.id);
  detailDialog.innerHTML = `<button class="close-dialog" aria-label="Close can details">${icon('close')}</button>
  <div class="detail-visual ${tried ? 'has-tried' : ''}" style="--can-color:${can.color}">${plate(can)}<span class="card-watermark" aria-hidden="true">${escape(can.family)}</span>${canVisual(can)}${tried ? '<span class="tried-stamp" aria-hidden="true">Tried</span>' : ''}${pickMode ? '<span class="pick-flag" aria-hidden="true">Try this next</span>' : ''}</div>
  <div class="detail-copy">
    <p class="eyebrow"><span class="family-label" style="--fam:${familyLivery[can.family]}">${familyName(can.family)} family</span></p>
    <h2 id="detail-title">${escape(can.name)}</h2>
    <p class="detail-flavor">${escape(can.flavor)}</p>
    <div class="detail-actions">${triedButton(can, true)}${ratingControls(can, true)}${collectionButton(can, true)}</div>
    <dl><div><dt>Family</dt><dd>${can.family}</dd></div><div><dt>Archive no.</dt><dd>${can.number}</dd></div><div><dt>Artwork</dt><dd>${can.image ? 'Product photo' : 'Photo wanted'}</dd></div></dl>
    <a class="source-link" href="${can.source}" target="_blank" rel="noreferrer">${can.source.endsWith('/energy-drinks/') ? 'Official Monster catalog' : 'View product source'} ${icon('arrow')}</a>
    <small class="detail-note">Packaging and availability vary by region. An archive entry does not confirm current production.</small>
    <div class="detail-nav">
      <button data-step="-1" aria-label="Previous can">${icon('back')}<span>Prev</span></button>
      ${pickMode ? `<button class="roll" data-pick-next>${icon('dice')}<span>Roll again</span></button>` : `<span class="detail-position">${position} / ${list.length}</span>`}
      <button data-step="1" aria-label="Next can"><span>Next</span>${icon('arrow')}</button>
    </div>
  </div>`;
}

function openDetail(can, opener) {
  currentCan = can;
  renderDetail(can);
  if (detailDialog.open) return;
  const inTracker = Boolean(opener?.closest?.('#tracker-panel'));
  openDialog(detailDialog, () => {
    const card = grid.querySelector(`.can-display[data-detail="${currentCan?.id}"]`);
    if (opener?.isConnected && opener.tabIndex >= 0 && !opener.closest('#grid') && currentCan?.id === can.id) return opener;
    return card || (inTracker ? $('#tracker-panel [data-pick-next]') : opener?.isConnected ? opener : null);
  });
}

function stepDetail(delta) {
  if (!currentCan) return;
  const list = visibleCans.some(item => item.id === currentCan.id) ? visibleCans : catalog;
  const index = list.findIndex(item => item.id === currentCan.id);
  pickMode = false;
  currentCan = list[(index + delta + list.length) % list.length];
  renderDetail(currentCan);
  detailDialog.scrollTop = 0;
  detailDialog.querySelector(`[data-step="${delta}"]`).focus({ preventScroll: true });
}

function pickNext(opener) {
  const selected = new Set(activeTracker().tried);
  const pool = catalog.filter(can => !selected.has(can.id) && can.id !== currentCan?.id);
  if (!pool.length) return showToast(selected.size >= catalog.length ? 'Nothing left to pick. You have tried every flavor.' : 'That is the last one on the list.');
  const rolling = Boolean(opener?.closest?.('#detail'));
  pickMode = true;
  openDetail(pool[Math.floor(Math.random() * pool.length)], opener);
  if (rolling) detailDialog.querySelector('[data-pick-next]')?.focus({ preventScroll: true });
}

function activeTracker() { return sharedTracker || tracker; }

function updateTrackerUrl() {
  if (sharedTracker) return;
  try { history.replaceState(null, '', location.pathname + location.search + trackingHash(tracker, {view:state.view === 'left' ? 'left' : undefined})); } catch { /* The copy link still works if history is unavailable. */ }
}

function persistTracker() {
  try { localStorage.setItem(TRACKING_KEY, JSON.stringify(tracker)); trackerStorageAvailable = true; } catch { trackerStorageAvailable = false; }
  updateTrackerUrl();
}

function renderSharedBanner() {
  const banner = $('#shared-banner');
  const signature = sharedTracker ? JSON.stringify([sharedTracker.name, tracker.tried.length > 0]) : '';
  if (signature !== bannerFor) {
    bannerFor = signature;
    banner.hidden = !sharedTracker;
    banner.innerHTML = sharedTracker ? `<div><strong>SHARED TRIED LIST // PREVIEW</strong><p>You are looking at ${sharedTracker.name ? `${escape(sharedTracker.name)}’s` : 'someone else’s'} snapshot. It is read-only and your own saved progress stays untouched.</p></div><div class="shared-actions"><button class="btn btn-primary" id="use-shared">${tracker.tried.length ? 'Add to my tracker' : 'Use this tracker'} ${icon('plus')}</button><button class="btn btn-ghost" id="back-to-mine">Back to my list</button></div>` : '';
  }
  // The banner only sticks on wide screens; the filter bar parks underneath it there.
  document.documentElement.style.setProperty('--banner-h', `${sharedTracker && getComputedStyle(banner).position === 'sticky' ? banner.offsetHeight : 0}px`);
}

function renderTracker() {
  const profile = activeTracker();
  const count = profile.tried.length;
  const left = catalog.length - count;
  const percent = Math.round(count / catalog.length * 100);
  $('.tried-count').textContent = count;
  $('.left-count').textContent = left;
  $('.hero-tried').textContent = count;
  $('#filter-tried-count').textContent = count;
  $('#filter-left-count').textContent = left;
  renderSharedBanner();
  const panel = $('#tracker-panel');
  if (state.view === 'collection') {
    panel.innerHTML = `<div class="pit pit-collection">
      <div class="pit-head"><p class="eyebrow">On the shelf</p><h2>MY <em>COLLECTION.</em></h2><p class="pit-copy">The cans you own, keep or hunted down. It is separate from your tried list, so a can can live in both.</p></div>
      <div class="pit-shelf"><strong>${saved.length}</strong><span>${saved.length === 1 ? 'can' : 'cans'} on<br>your shelf</span></div>
      <div class="pit-actions"><button class="btn btn-primary" data-view="archive" data-scroll="catalog">Add more cans ${icon('plus')}</button><p class="tracker-save-note">${storageAvailable ? 'Saved automatically in this browser.' : 'Browser storage is unavailable, so this collection lasts for this visit only.'}</p></div>
    </div>`;
    return;
  }
  const values = Object.values(profile.ratings || {});
  const average = values.length ? (values.reduce((sum,rating)=>sum+rating,0)/values.length).toFixed(1) : null;
  const rank = rankFor(count);
  const ratio = count / catalog.length;
  const owner = sharedTracker ? 'THEIR' : 'YOUR';
  const copy = sharedTracker ? 'A shared snapshot. Add it to your tracker to start marking cans yourself.'
    : !trackerStorageAvailable ? 'Browser storage is unavailable. Copy your tracking link to keep your progress.'
    : state.view === 'left' ? 'Every flavor you have not had yet. Mark one tried and it moves to your tried list.'
    : 'Mark what you have tried. Rate your favorites. Make it shareable.';
  panel.innerHTML = `<div class="pit">
    <div class="pit-head"><p class="eyebrow">${sharedTracker ? 'Shared flavor passport' : 'Your flavor passport'}</p><h2>${profile.name ? `${escape(profile.name)}’S` : owner} <em>${state.view === 'left' ? 'LEFT TO TRY.' : 'TRIED LIST.'}</em></h2><p class="pit-copy">${copy}</p><span class="rating-summary">${average ? `${values.length} RATED // ${average}/5 AVERAGE` : 'RATE YOUR TRIED CANS TO FIND YOUR FAVORITES'}</span></div>
    <div class="pit-gauge">
      <div class="gauge" role="progressbar" aria-label="Flavors tried" aria-valuemin="0" aria-valuemax="${catalog.length}" aria-valuenow="${count}" aria-valuetext="${count} of ${catalog.length} tried">${tach(ratio, lastRatio ?? ratio)}<div class="gauge-count"><strong>${count}</strong><small>/${catalog.length}</small></div></div>
      <div class="gauge-meta"><span class="rank">${rank.name}</span><span class="rank-next">${rank.next ? `${rank.next[0] - count} more to hit <b>${rank.next[1]}</b>` : 'Every flavor tried'}</span><span class="left-line">${percent}% done. ${left} left to try.</span></div>
    </div>
    <div class="pit-actions">
      <button class="btn btn-primary tracker-share" data-open-share>${icon('share')} Make share card</button>
      <button class="btn btn-ghost tracker-link" id="copy-tracker-link">${icon('link')} Copy tracking link</button>
      ${left ? `<button class="btn btn-ghost" data-pick-next>${icon('dice')} Pick my next can</button>` : ''}
      ${sharedTracker ? '' : `<p class="tracker-save-note">${trackerStorageAvailable ? 'Saved automatically in this browser. Your link is a copy of this progress.' : 'Not saved in this browser. Your link is the backup.'}</p>`}
    </div>
    ${!count && !sharedTracker ? `<ol class="pit-steps"><li><b>1</b><span><strong>Hit “Mark as tried”</strong> on every flavor you have had.</span></li><li><b>2</b><span><strong>Rate it</strong> out of five. Rating a can marks it tried for you.</span></li><li><b>3</b><span><strong>Make a share card</strong> and flex your list.</span></li></ol>` : ''}
  </div>`;
  lastRatio = ratio;
}

function setTracker(next) {
  tracker = next;
  persistTracker();
}

function toggleTried(id) {
  if (sharedTracker) return showToast('Preview mode. Add this list to your tracker to make changes.');
  const can = catalog.find(can => can.id === id);
  if (!can) return;
  const before = tracker;
  const wasTried = tracker.tried.includes(id);
  const hadRating = tracker.ratings?.[id];
  setTracker(normalizeProfile({ ...tracker, tried:wasTried ? tracker.tried.filter(value=>value!==id) : [...tracker.tried,id] }));
  refresh(`[data-tried="${id}"]`, '[data-tried-filter="tried"]');
  if (!wasTried) celebrate(id);
  showToast(trackerStorageAvailable ? `${can.name} ${wasTried ? `removed from your tried list${hadRating ? ' and its rating cleared' : ''}` : 'added to your tried list'}` : 'Updated for this visit. Copy your tracking link to save this progress.', () => {
    setTracker(before);
    refresh();
    showToast(`Undone. ${can.name} is ${wasTried ? 'back on' : 'off'} your tried list.`);
  });
}

function rateCan(id, value) {
  if (sharedTracker) return showToast('Preview mode. Add this list to your tracker to change ratings.');
  const can = catalog.find(can => can.id === id);
  if (!can || !Number.isInteger(value) || value < 0 || value > 5) return;
  const before = tracker;
  const wasTried = tracker.tried.includes(id);
  if (!wasTried && !value) return;
  const ratings = { ...tracker.ratings };
  if (value) ratings[id] = value; else delete ratings[id];
  // Rating a can you have not marked yet marks it tried in the same step.
  setTracker(normalizeProfile({ ...tracker, tried:wasTried ? tracker.tried : [...tracker.tried, id], ratings }));
  refresh(`[data-rate="${id}"][data-value="${value || 1}"]`);
  if (!wasTried) celebrate(id);
  showToast(!trackerStorageAvailable ? 'Rating updated. Copy your link to keep it outside this visit.' : value ? `${can.name} rated ${value}/5${wasTried ? '' : ' and marked tried'}` : `${can.name} rating cleared`, () => {
    setTracker(before);
    refresh();
    showToast(`Undone. ${can.name} is back how it was.`);
  });
}

/** Claw strike and stamp on the card that was just marked tried. */
function celebrate(id) {
  const stage = (detailDialog.open ? detailDialog.querySelector('.detail-visual') : grid.querySelector(`[data-id="${id}"] .card-stage`));
  if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  stage.classList.add('just-tried');
  stage.insertAdjacentHTML('beforeend', cardStrike);
  setTimeout(() => { stage.classList.remove('just-tried'); stage.querySelector('.strike')?.remove(); }, 900);
}

function adoptSharedTracker() {
  if (!sharedTracker) return;
  const nextView = state.view;
  tracker = normalizeProfile({ name:tracker.name || sharedTracker.name, tried:[...tracker.tried,...sharedTracker.tried], ratings:{...sharedTracker.ratings,...tracker.ratings} });
  sharedTracker = null;
  persistTracker();
  setView(nextView === 'left' ? 'left' : 'tracker');
  showToast('Your tracker is ready. Mark more cans or save your new link.');
}

function openShareCard(opener) {
  $('#card-name').value = activeTracker().name;
  $('#card-name').readOnly = Boolean(sharedTracker);
  $('#share-preview').replaceChildren();
  $('#share-link').value = trackingLink(activeTracker());
  const inTracker = Boolean(opener?.closest?.('#tracker-panel'));
  openDialog(shareDialog, () => inTracker ? $('#tracker-panel [data-open-share]') : opener?.isConnected ? opener : null);
  renderShareCard();
}

async function renderShareCard() {
  const version = ++shareVersion;
  shareArtifact = null;
  $('#download-png').disabled = true;
  $('#native-share').hidden = true;
  $('#retry-card').hidden = true;
  $('#share-status').textContent = 'Building your card…';
  $('#share-link').value = trackingLink(activeTracker());
  try {
    const artifact = await makeShareCard(activeTracker(), catalog);
    if (version !== shareVersion || !shareDialog.open) return;
    shareArtifact = artifact;
    $('#share-preview').replaceChildren(artifact.canvas);
    $('#share-status').textContent = `${artifact.count} tried cans. PNG ready to share.`;
    $('#download-png').disabled = false;
    const file = cardFile();
    try { $('#native-share').hidden = !navigator.canShare?.({ files:[file] }); } catch { /* Download and copy work without native file sharing. */ }
  } catch (error) {
    if (version !== shareVersion || !shareDialog.open) return;
    $('#share-status').textContent = error.message || 'The card could not be created. You can still copy your link.';
    $('#retry-card').hidden = false;
  }
}

function cardFile() {
  const name = activeTracker().name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'my';
  return new File([shareArtifact.blob], `monsterdb-${name}-tried-${shareArtifact.count}.png`, { type:'image/png' });
}

function downloadCard() {
  if (!shareArtifact) return;
  const file = cardFile();
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.hidden = true;
  shareDialog.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  showToast('Your share PNG is ready. Post it with your personal tracking link.');
}

async function shareCardNatively() {
  if (!shareArtifact || !navigator.share) return;
  try {
    await navigator.share({ files:[cardFile()], title:'My MonsterDB tried list', text:`I have tried ${shareArtifact.count}/${catalog.length} Monster flavors. See my list and build yours: ${shareArtifact.link}` });
  } catch (error) { if (error.name !== 'AbortError') showToast('Sharing was unavailable. Download the PNG and copy your link instead.'); }
}

async function copyTrackerLink(opener) {
  const link = trackingLink(activeTracker(), {view:!shareDialog.open && state.view === 'left' ? 'left' : undefined});
  try { await navigator.clipboard.writeText(link); showToast('Personal tracking link copied. Save a fresh link after adding cans.'); }
  catch {
    if (!shareDialog.open) openShareCard(opener);
    const input = $('#share-link'); input.value = link; input.focus(); input.select();
    showToast('Your link is selected. Copy it with your browser.');
  }
}

function openDialog(dialog, restorer) {
  const opener = document.activeElement;
  restoreFocus = restorer || (() => opener?.isConnected ? opener : null);
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

function setView(view, filter = view === 'left' ? 'left' : view === 'tracker' ? 'tried' : 'all') {
  state.view = view;
  state.collection = view === 'collection';
  state.triedFilter = filter;
  document.body.dataset.page = view;
  document.querySelectorAll('nav [data-view]').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  $('#catalog-eyebrow').textContent = { archive:'Open the vault', tracker:'Tried and tested', left:'The hit list', collection:'On the shelf' }[view];
  $('#catalog-title').innerHTML = view === 'left' ? 'YOUR NEXT <em>OBSESSION.</em>' : view === 'tracker' ? 'YOUR TASTE. <em>YOUR RULES.</em>' : view === 'collection' ? 'YOUR CANS. <em>YOUR RULES.</em>' : 'PICK YOUR <em>POISON.</em>';
  if ((view === 'tracker' || view === 'left') && !sharedTracker) updateTrackerUrl();
  renderGrid({ enter: true });
}

/** Switch lists from inside the catalog without throwing the user to a different part of the page. */
function switchInPlace(change) {
  const anchor = $('#filters-anchor');
  const before = anchor.getBoundingClientRect().top;
  const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--banner-h')) || 0;
  change();
  const after = anchor.getBoundingClientRect().top;
  window.scrollBy({ top: before < offset ? after - offset : after - before, ...instant });
}

function clearCatalogFilters() {
  Object.assign(state, { query: '', family: 'All', photos: false, sort: 'shelf' });
  searchInput.value = '';
  if ($('#photos')) $('#photos').checked = false;
  $('#sort').value = 'shelf';
  document.querySelectorAll('[data-family]').forEach(b => { const active = b.dataset.family === 'All'; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
}
function reset() { clearCatalogFilters(); setView('archive'); }

document.addEventListener('click', event => {
  const target = event.target;
  if (target.closest('#toast-undo')) { const undo = toastUndo; hideToast(); return undo?.(); }
  const rating = target.closest('[data-rate]');
  if (rating) return rateCan(rating.dataset.rate, Number(rating.dataset.value));
  const clearRating = target.closest('[data-clear-rating]');
  if (clearRating) return rateCan(clearRating.dataset.clearRating, 0);
  const tried = target.closest('[data-tried]');
  if (tried) return toggleTried(tried.dataset.tried);
  const step = target.closest('[data-step]');
  if (step) return stepDetail(Number(step.dataset.step));
  const pick = target.closest('[data-pick-next]');
  if (pick) return pickNext(pick);
  const triedFilter = target.closest('[data-tried-filter]');
  if (triedFilter) {
    const filter = triedFilter.dataset.triedFilter;
    return switchInPlace(() => setView(filter === 'left' ? 'left' : filter === 'tried' ? 'tracker' : 'archive'));
  }
  const share = target.closest('[data-open-share]');
  if (share) return openShareCard(share);
  const copy = target.closest('#copy-tracker-link, #copy-share-link');
  if (copy) return copyTrackerLink(copy);
  if (target.closest('#use-shared')) return adoptSharedTracker();
  if (target.closest('#back-to-mine')) { sharedTracker = null; updateTrackerUrl(); setView('tracker'); return; }
  if (target.closest('#download-png')) return downloadCard();
  if (target.closest('#native-share')) return shareCardNatively();
  if (target.closest('#retry-card')) return renderShareCard();
  const collect = target.closest('[data-collect]');
  if (collect) return toggleCollection(collect.dataset.collect);
  const detail = target.closest('[data-detail]');
  if (detail) { pickMode = false; return openDetail(catalog.find(c => c.id === detail.dataset.detail), detail); }
  const family = target.closest('[data-family]');
  if (family) {
    state.family = family.dataset.family;
    document.querySelectorAll('[data-family]').forEach(b => { b.classList.toggle('active', b === family); b.setAttribute('aria-pressed', b === family); });
    return renderGrid({ enter: true });
  }
  const view = target.closest('button[data-view]');
  if (view) {
    if (view.closest('.status-tabs')) return switchInPlace(() => setView(view.dataset.view));
    // Navigation behaves like opening a page: fresh filters, starting from the top.
    clearCatalogFilters();
    setView(view.dataset.view);
    if (view.dataset.scroll === 'catalog') $('#catalog').scrollIntoView(instant); else window.scrollTo({ top: 0, ...instant });
    return;
  }
  if (target.closest('#explore')) return $('#catalog').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (target.closest('.brand')) { event.preventDefault(); reset(); window.scrollTo({ top: 0, ...instant }); return; }
  if (target.closest('#reset')) return switchInPlace(reset);
  if (target.closest('#clear-filters')) { clearCatalogFilters(); renderGrid({ enter: true }); return searchInput.focus({ preventScroll: true }); }
  if (target.closest('#search-clear')) { state.query = searchInput.value = ''; renderGrid({ enter: true }); return searchInput.focus({ preventScroll: true }); }
  if (target.closest('#about')) return openDialog($('#about-dialog'));
  if (target.closest('.close-dialog')) return target.closest('dialog').close();
  if (target.closest('#back-top')) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

searchInput.addEventListener('input', e => { state.query = e.target.value; renderGrid(); });
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape' && searchInput.value) { e.preventDefault(); state.query = searchInput.value = ''; renderGrid(); }
});
$('#photos')?.addEventListener('change', e => { state.photos = e.target.checked; renderGrid({ enter: true }); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid({ enter: true }); });
document.addEventListener('keydown', e => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); searchInput.focus(); return; }
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const direction = e.key === 'ArrowRight' ? 1 : -1;
  const star = e.target.closest?.('[data-rate]');
  if (star) {
    // Stars are one tab stop; arrows move between them.
    const stars = [...star.parentElement.children];
    const next = stars[stars.indexOf(star) + direction];
    if (next && !next.disabled) { e.preventDefault(); next.focus(); }
    return;
  }
  if (detailDialog.open && !typing) { e.preventDefault(); stepDetail(direction); }
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (toast.parentElement === dialog) document.body.append(toast);
    const target = restoreFocus?.();
    restoreFocus = null;
    if (dialog === detailDialog) { currentCan = null; pickMode = false; }
    if (dialog === shareDialog) { shareVersion++; clearTimeout(shareTimer); shareArtifact = null; }
    (target || $('.nav-link.active')).focus({ preventScroll: true });
  });
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    }
  });
});
$('#card-name').addEventListener('input', event => {
  if (sharedTracker) return;
  tracker = normalizeProfile({ ...tracker, name:event.target.value });
  persistTracker();
  renderTracker();
  shareVersion++;
  shareArtifact = null;
  $('#download-png').disabled = true;
  $('#native-share').hidden = true;
  $('#share-link').value = trackingLink(activeTracker());
  clearTimeout(shareTimer);
  shareTimer = setTimeout(renderShareCard, 250);
});
window.addEventListener('hashchange', () => {
  const incoming = readTrackingHash(location.hash);
  if (incoming?.error) return showToast(incoming.error);
  if (incoming?.profile) {
    sharedTracker = sameProfile(incoming.profile,tracker) ? null : incoming.profile;
    setView(incoming.view);
  }
});
window.addEventListener('resize', () => { if (sharedTracker) renderSharedBanner(); });
new IntersectionObserver(([entry]) => {
  $('#filters').classList.toggle('is-stuck', !entry.isIntersecting && entry.boundingClientRect.top < innerHeight / 2);
}).observe($('#filters-anchor'));

setView(incomingTracker?.profile ? incomingTracker.view : 'archive');
if (incomingTracker?.error) showToast(incomingTracker.error);
