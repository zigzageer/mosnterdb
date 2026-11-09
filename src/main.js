import '@fontsource/anton/latin-400.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/dm-sans/latin-400.css';
import { catalog, families, filterCatalog } from './catalog.js';
import { TRACKING_KEY, normalizeProfile, sameProfile, trackingHash, trackingLink, readTrackingHash } from './tracking.js';
import { makeShareCard } from './share-card.js';
import './style.css';

const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  share: '<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
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
let tracker = normalizeProfile();
let trackerStorageAvailable = true;
try { tracker = normalizeProfile(JSON.parse(localStorage.getItem(TRACKING_KEY) || '{}')); } catch { trackerStorageAvailable = false; }
const incomingTracker = readTrackingHash(location.hash);
let sharedTracker = incomingTracker?.profile && !sameProfile(incomingTracker.profile, tracker) ? incomingTracker.profile : null;
let shareArtifact;
let shareVersion = 0;
let shareTimer;

const state = { view: 'archive', triedFilter: 'all', query: '', family: 'All', photos: false, collection: false, sort: 'shelf', saved };
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
    <nav aria-label="Main navigation"><button class="nav-link active" data-view="archive" aria-current="page">THE ARCHIVE <span>↗</span></button><button class="nav-link" data-view="collection">My collection <span class="count collection-count">${saved.length}</span></button><button class="nav-link" data-view="tracker">My tried list <span class="count tried-count">${tracker.tried.length}</span></button></nav>
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
    <section class="tracker-panel" id="tracker-panel" aria-label="Your flavor passport"></section>
    <section class="catalog-section" id="catalog" aria-labelledby="catalog-title">
      <div class="catalog-title-row"><div><div class="eyebrow">// OPEN THE VAULT</div><h2 id="catalog-title">PICK YOUR <em>POISON.</em></h2></div><div class="catalog-stats"><strong>${String(catalog.length).padStart(3,'0')}</strong><span>FLAVORS INDEXED<br><b>${photoCount} REAL CAN PHOTOS</b></span></div></div>
      <div class="catalog-panel">
        <div class="toolbar"><label class="search">${icon('search')}<input id="search" type="search" placeholder="SEARCH THE MADNESS…" autocomplete="off" aria-label="Search cans"/><kbd>/</kbd></label><div class="toolbar-right"><label class="photo-toggle"><input id="photos" type="checkbox"/><span class="switch" aria-hidden="true"></span> Photos only</label><label class="sort-label">SORT <select id="sort" aria-label="Sort cans"><option value="shelf">Archive order</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option></select></label></div></div>
        <div class="family-bar"><div class="family-tabs" role="group" aria-label="Filter by family"><button class="family-tab active" data-family="All" aria-pressed="true">ALL CANS <span>${catalog.length}</span></button>${families.map(f=>`<button class="family-tab" data-family="${f}" aria-pressed="false">${f}</button>`).join('')}</div></div>
        <div class="tracking-filters" role="group" aria-label="Filter by tried status"><button data-tried-filter="all" aria-pressed="true">ALL FLAVORS <span id="all-tried-count">${catalog.length}</span></button><button data-tried-filter="tried" aria-pressed="false">TRIED <span id="filter-tried-count">0</span></button><button data-tried-filter="left" aria-pressed="false">LEFT TO TRY <span id="filter-left-count">${catalog.length}</span></button><button class="mini-share" data-open-share>${icon('share')} MAKE A SHARE CARD</button></div>
        <div class="results-bar"><span id="result-summary" role="status"></span><span>COLLECT IT. TRY IT. TELL THE WORLD.</span></div>
        <div id="grid" class="can-grid"></div><div id="empty" class="empty" hidden></div>
      </div>
    </section>
    <section class="collector-banner"><div><span class="eyebrow">IT'S MORE THAN A DRINK.</span><h2>IT'S A WHOLE<br><em>PERSONALITY.</em></h2></div><div><p>The weird ones. The hard-to-find ones. The one you bought on a road trip. Keep them all in one place.</p><button class="hero-cta" data-view="collection">BUILD YOUR COLLECTION ${icon('arrow')}</button></div><span class="banner-star" aria-hidden="true">✳</span></section>
    <footer><a class="brand" href="#" aria-label="MonsterDB home">${claw}<span>MONSTER<span class="brand-db">//DB</span></span></a><div><span>MADE BY FANS. FOR THE OBSESSED.</span><p>A growing independent archive. Not affiliated with Monster Energy.<br>Regional editions and historical releases are still being documented.</p></div><button id="back-top">BACK TO THE TOP ${icon('arrow')}</button></footer>
  </main>
  <dialog id="detail" aria-labelledby="detail-title"></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><button class="close-dialog" aria-label="Close about dialog">${icon('close')}</button><div class="eyebrow">THE UNOFFICIAL CAN ARCHIVE</div><h2 id="about-title">EVERY CAN HAS<br><em>A STORY.</em></h2><p>MonsterDB is for the people who keep the empty can. Discover flavors, revisit the classics, and make a collection of your own.</p><div class="about-facts"><span><strong>${catalog.length}</strong> flavors indexed</span><span><strong>${photoCount}</strong> real can photos</span></div><h3>STILL HUNTING.</h3><p>This archive is growing. Regional editions, packaging redesigns, release dates, and availability need further verification. It is not yet a complete history of every Monster ever made.</p><p>Photos are sourced from public product catalogs and showcase datasets, with provenance recorded in the project. Missing photos are clearly marked. Product imagery and trademarks belong to their owners.</p><h3>YOUR CANS. YOUR BROWSER.</h3><p>Your collection and tried list save automatically in this browser. No account needed. Copy your personal tracking link to keep a snapshot or open it on another device. Opening someone else’s link previews their list without replacing yours. Each link captures the progress at the time it was copied; copy or bookmark a new link after updates.</p><a class="source-link" href="https://www.monsterenergy.com/en-us/energy-drinks/" target="_blank" rel="noreferrer">OFFICIAL MONSTER LINEUP ${icon('arrow')}</a></dialog>
  <dialog id="share-dialog" aria-labelledby="share-title"><button class="close-dialog" aria-label="Close share card">${icon('close')}</button><div class="share-editor"><div class="eyebrow">YOUR TASTE. LOUD &amp; PROUD.</div><h2 id="share-title">MAKE IT<br><em>SHAREABLE.</em></h2><label class="card-name-label">NAME ON YOUR CARD (OPTIONAL)<input id="card-name" type="text" maxlength="28" autocomplete="nickname" placeholder="Your name"/></label><p>Every tried can. One graphic. Download the PNG or share it from your phone. Its QR code opens this exact list.</p><div id="share-status" role="status">Building your card…</div><div class="share-actions"><button class="collect-main" id="download-png" disabled>${icon('share')} DOWNLOAD PNG</button><button class="outline-button" id="native-share" hidden>SHARE IMAGE</button><button class="outline-button" id="copy-share-link">COPY PERSONAL LINK</button><button class="outline-button" id="retry-card" hidden>RETRY CARD</button></div><label class="share-link-label">YOUR PERSONAL TRACKING LINK<input id="share-link" type="text" readonly aria-label="Personal tracking link"/></label><p class="share-link-note">This link holds a snapshot of your tried list. Save a fresh link after adding cans. Browser progress saves automatically.</p></div><div class="share-preview" id="share-preview"></div></dialog>
  <div id="toast" role="status" aria-live="polite"></div>
`;

function canVisual(can) {
  if (can.image) return `<img class="can-photo" src="${can.image}" alt="${escape(can.name)} can" loading="lazy" decoding="async"/>`;
  return `<div class="ghost-can" role="img" aria-label="Photo missing for ${escape(can.name)}"><span class="ghost-top"></span>${claw}<strong>PHOTO<br>WANTED.</strong><small>THE HUNT CONTINUES</small></div>`;
}

function triedButton(can, modal = false) {
  const tried = activeTracker().tried.includes(can.id);
  return `<button class="tried-toggle ${modal ? 'tried-detail' : ''} ${tried ? 'is-tried' : ''}" data-tried="${can.id}" aria-label="Mark ${escape(can.name)} as ${tried ? 'not tried' : 'tried'}" aria-pressed="${tried}" ${sharedTracker ? 'disabled title="Use this list as your tracker to make changes"' : ''}>${icon(tried ? 'check' : 'plus')} ${tried ? 'TRIED IT' : 'MARK AS TRIED'}<span>${tried ? 'SAVED' : 'NOT YET'}</span></button>`;
}

function collectionButton(can, modal = false) {
  const added = saved.includes(can.id);
  return `<button class="${modal ? 'collect-main' : 'collect-button'} ${added ? 'is-saved' : ''}" data-collect="${can.id}" aria-label="${added ? 'Remove' : 'Add'} ${escape(can.name)} ${added ? 'from' : 'to'} collection" aria-pressed="${added}">${icon(added ? 'check' : 'plus')}${modal ? (added ? 'In your collection' : 'Add to my collection') : ''}</button>`;
}

function renderGrid() {
  state.saved = saved;
  const selected = new Set(activeTracker().tried);
  let cans = filterCatalog(state);
  if (state.triedFilter === 'tried') cans = cans.filter(can => selected.has(can.id));
  if (state.triedFilter === 'left') cans = cans.filter(can => !selected.has(can.id));
  renderTracker();
  document.querySelector('#result-summary').textContent = `${String(cans.length).padStart(2, '0')} CANS FOUND${state.collection ? ' // YOUR COLLECTION' : state.view === 'tracker' ? ' // YOUR TRIED LIST' : ' // THE ARCHIVE'}`;
  document.querySelector('#grid').innerHTML = cans.map(can => `<article class="can-card ${can.image ? '' : 'missing-photo'} ${selected.has(can.id) ? 'has-tried' : ''}" style="--can-color:${can.color}">
    <div class="card-top"><span class="serial">M//${can.number}</span>${collectionButton(can)}</div>
    <button class="can-display" data-detail="${can.id}" aria-label="View ${escape(can.name)} details"><span class="card-orbit" aria-hidden="true"></span><span class="card-watermark" aria-hidden="true">${escape(can.family)}</span>${canVisual(can)}<span class="stage-caption">${can.image ? 'THE REAL DEAL' : 'PHOTO NOT YET SOURCED'} // ${can.number}</span></button>
    <button class="can-label" data-detail="${can.id}" aria-label="Details for ${escape(can.name)}"><span class="family-label"><i></i>${can.family === 'Juiced' ? 'JUICED / PUNCH' : can.family.toUpperCase()}</span><h2>${escape(can.name)}</h2><p>${escape(can.flavor)}</p><span class="label-arrow">${icon('arrow')}</span></button>${triedButton(can)}
  </article>`).join('');
  const empty = document.querySelector('#empty');
  empty.hidden = cans.length > 0;
  const firstTry = state.view === 'tracker' && state.triedFilter === 'tried' && !selected.size;
  if (firstTry) { empty.innerHTML = `${icon('check')}<h2>YOUR FIRST CAN IS OUT THERE.</h2><p>Mark the flavors you have tried, then turn your list into a share card.</p><button class="collect-main" data-tried-filter="left">FIND YOUR FIRST CAN ${icon('arrow')}</button>`; return; }
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
  document.querySelector('#detail').innerHTML = `<button class="close-dialog" aria-label="Close can details">${icon('close')}</button><div class="detail-visual" style="--can-color:${can.color}"><span class="detail-serial">M//${can.number} — ARCHIVE ENTRY</span><span class="card-orbit"></span>${canVisual(can)}</div><div class="detail-copy"><div class="eyebrow">${can.family.toUpperCase()} // MONSTER ARCHIVE</div><h2 id="detail-title">${escape(can.name)}</h2><p class="detail-flavor">${escape(can.flavor)}</p><div class="detail-divider"></div><p>${can.image ? 'One more for the collection. Claim this can and keep your personal lineup in one place.' : 'Still hunting for this one. A sourced photo of the packaging has not been added yet.'}</p><dl><div><dt>FAMILY</dt><dd>${can.family}</dd></div><div><dt>ARTWORK</dt><dd>${can.image ? 'Product photo' : 'Photo wanted'}</dd></div></dl>${collectionButton(can, true)}${triedButton(can, true)}<a class="source-link" href="${can.source}" target="_blank" rel="noreferrer">${can.source.endsWith('/energy-drinks/') ? 'OFFICIAL MONSTER CATALOG' : 'VIEW PRODUCT SOURCE'} ${icon('arrow')}</a><small class="detail-note">Packaging and availability vary by region. An archive entry does not confirm current production.</small></div>`;
}

function activeTracker() { return sharedTracker || tracker; }

function updateTrackerUrl() {
  if (sharedTracker) return;
  try { history.replaceState(null, '', location.pathname + location.search + trackingHash(tracker)); } catch { /* The copy link still works if history is unavailable. */ }
}

function persistTracker() {
  try { localStorage.setItem(TRACKING_KEY, JSON.stringify(tracker)); trackerStorageAvailable = true; } catch { trackerStorageAvailable = false; }
  updateTrackerUrl();
}

function renderTracker() {
  const restoreShareFocus = lastFocus?.closest?.('#tracker-panel') && lastFocus.hasAttribute('data-open-share');
  const profile = activeTracker();
  const count = profile.tried.length;
  const percent = Math.round(count / catalog.length * 100);
  document.querySelector('.tried-count').textContent = tracker.tried.length;
  document.querySelector('#filter-tried-count').textContent = count;
  document.querySelector('#filter-left-count').textContent = catalog.length - count;
  document.querySelectorAll('[data-tried-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.triedFilter === state.triedFilter));
  document.querySelector('#tracker-panel').innerHTML = `<div class="tracker-heading"><span class="eyebrow">${sharedTracker ? 'SHARED TRIED LIST // PREVIEW' : 'YOUR FLAVOR PASSPORT'}</span><h2>${profile.name ? `${escape(profile.name)}’S` : 'YOUR'} <em>TRIED LIST.</em></h2><p>${sharedTracker ? 'Viewing a shared snapshot. Your own saved progress stays untouched.' : trackerStorageAvailable ? 'Mark what you have tried. Find what is next. Make it shareable.' : 'Browser storage is unavailable. Copy your tracking link to keep your progress.'}</p></div><div class="tracker-progress"><div class="tracker-numbers"><strong>${count}<small>/${catalog.length}</small></strong><span>TRIED<br><b>${catalog.length-count} LEFT TO TRY</b></span><em>${percent}%</em></div><div class="progress-track" role="progressbar" aria-label="Flavors tried" aria-valuemin="0" aria-valuemax="${catalog.length}" aria-valuenow="${count}"><span style="width:${percent}%"></span></div><div class="tracker-actions"><button class="tracker-share" data-open-share>${icon('share')} MAKE SHARE CARD</button><button class="tracker-link" id="copy-tracker-link">COPY TRACKING LINK ${icon('arrow')}</button></div>${sharedTracker ? `<div class="shared-actions"><button id="use-shared">${tracker.tried.length ? 'ADD TO MY TRACKER' : 'USE THIS TRACKER'} ${icon('plus')}</button><button id="back-to-mine">BACK TO MY LIST</button></div>` : '<span class="tracker-save-note">SAVED IN THIS BROWSER · PERSONAL LINK = A COPY OF THIS PROGRESS</span>'}</div>`;
  if (restoreShareFocus) lastFocus = document.querySelector('#tracker-panel [data-open-share]');
}

function toggleTried(id) {
  if (sharedTracker) return showToast('Use this list as your tracker to make changes.');
  const can = catalog.find(can => can.id === id);
  if (!can) return;
  const wasTried = tracker.tried.includes(id);
  tracker = normalizeProfile({ ...tracker, tried:wasTried ? tracker.tried.filter(value=>value!==id) : [...tracker.tried,id] });
  persistTracker();
  const returnId = lastFocus?.dataset.detail;
  renderGrid();
  if (returnId) lastFocus = document.querySelector(`[data-detail="${returnId}"]`);
  if (currentCan && document.querySelector('#detail').open) renderDetail(currentCan);
  const focusRoot = document.querySelector('#detail').open ? document.querySelector('#detail') : document.querySelector('#grid');
  (focusRoot.querySelector(`[data-tried="${id}"]`) || document.querySelector('[data-tried-filter="tried"]')).focus({ preventScroll:true });
  showToast(trackerStorageAvailable ? `${can.name} ${wasTried ? 'removed from' : 'added to'} your tried list` : 'Updated for this visit. Copy your tracking link to save this progress.');
}

function adoptSharedTracker() {
  if (!sharedTracker) return;
  tracker = normalizeProfile({ name:tracker.name || sharedTracker.name, tried:[...tracker.tried,...sharedTracker.tried] });
  sharedTracker = null;
  persistTracker();
  setView('tracker');
  showToast('Your tracker is ready. Mark more cans or save your new link.');
}

function openShareCard() {
  document.querySelector('#card-name').value = activeTracker().name;
  document.querySelector('#card-name').readOnly = Boolean(sharedTracker);
  document.querySelector('#share-preview').replaceChildren();
  document.querySelector('#share-link').value = trackingLink(activeTracker());
  openDialog(document.querySelector('#share-dialog'));
  renderShareCard();
}

async function renderShareCard() {
  const version = ++shareVersion;
  shareArtifact = null;
  document.querySelector('#download-png').disabled = true;
  document.querySelector('#native-share').hidden = true;
  document.querySelector('#retry-card').hidden = true;
  document.querySelector('#share-status').textContent = 'Building your card…';
  document.querySelector('#share-link').value = trackingLink(activeTracker());
  try {
    const artifact = await makeShareCard(activeTracker(), catalog);
    if (version !== shareVersion || !document.querySelector('#share-dialog').open) return;
    shareArtifact = artifact;
    document.querySelector('#share-preview').replaceChildren(artifact.canvas);
    document.querySelector('#share-status').textContent = `${artifact.count} tried cans. PNG ready to share.`;
    document.querySelector('#download-png').disabled = false;
    const file = cardFile();
    try { document.querySelector('#native-share').hidden = !navigator.canShare?.({ files:[file] }); } catch { /* Download and copy work without native file sharing. */ }
  } catch (error) {
    if (version !== shareVersion || !document.querySelector('#share-dialog').open) return;
    document.querySelector('#share-status').textContent = error.message || 'The card could not be created. You can still copy your link.';
    document.querySelector('#retry-card').hidden = false;
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
  document.querySelector('#share-dialog').append(anchor);
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

async function copyTrackerLink() {
  const link = trackingLink(activeTracker());
  try { await navigator.clipboard.writeText(link); showToast('Personal tracking link copied. Save a fresh link after adding cans.'); }
  catch {
    if (!document.querySelector('#share-dialog').open) openShareCard();
    const input = document.querySelector('#share-link'); input.value = link; input.focus(); input.select();
    showToast('Your link is selected. Copy it with your browser.');
  }
}

function openDialog(dialog) {
  lastFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

function setView(view, filter = view === 'tracker' ? 'tried' : 'all') {
  state.view = view;
  state.collection = view === 'collection';
  state.triedFilter = filter;
  document.body.classList.toggle('tracker-view', view === 'tracker');
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  document.querySelector('#page-title').innerHTML = view === 'collection' ? 'YOUR CANS.<br><em>YOUR RULES.</em>' : 'UNLEASH<br>THE <em>OBSESSION.</em>';
  document.querySelector('#catalog-title').innerHTML = view === 'tracker' ? 'YOUR TASTE. <em>YOUR RULES.</em>' : 'PICK YOUR <em>POISON.</em>';
  renderGrid();
}

document.addEventListener('click', event => {
  const tried = event.target.closest('[data-tried]');
  if (tried) return toggleTried(tried.dataset.tried);
  const triedFilter = event.target.closest('[data-tried-filter]');
  if (triedFilter) return setView('tracker', triedFilter.dataset.triedFilter);
  if (event.target.closest('[data-open-share]')) return openShareCard();
  if (event.target.closest('#copy-tracker-link') || event.target.closest('#copy-share-link')) return copyTrackerLink();
  if (event.target.closest('#use-shared')) return adoptSharedTracker();
  if (event.target.closest('#back-to-mine')) { sharedTracker = null; updateTrackerUrl(); setView('tracker'); return; }
  if (event.target.closest('#download-png')) return downloadCard();
  if (event.target.closest('#native-share')) return shareCardNatively();
  if (event.target.closest('#retry-card')) return renderShareCard();
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
  if (view) { setView(view.dataset.view); if (view.closest('.collector-banner')) document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth' }); return; }
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
  setView('archive');
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
    if (dialog.id === 'share-dialog') { shareVersion++; clearTimeout(shareTimer); shareArtifact = null; }
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
document.querySelector('#card-name').addEventListener('input', event => {
  if (sharedTracker) return;
  tracker = normalizeProfile({ ...tracker, name:event.target.value });
  persistTracker();
  renderTracker();
  shareVersion++;
  shareArtifact = null;
  document.querySelector('#download-png').disabled = true;
  document.querySelector('#native-share').hidden = true;
  document.querySelector('#share-link').value = trackingLink(activeTracker());
  clearTimeout(shareTimer);
  shareTimer = setTimeout(renderShareCard, 250);
});
window.addEventListener('hashchange', () => {
  const incoming = readTrackingHash(location.hash);
  if (incoming?.error) return showToast(incoming.error);
  if (incoming?.profile) {
    sharedTracker = sameProfile(incoming.profile,tracker) ? null : incoming.profile;
    setView('tracker');
  }
});
setView(incomingTracker?.profile ? 'tracker' : 'archive');
if (incomingTracker?.error) showToast(incomingTracker.error);
