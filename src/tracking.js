import trackingIds from './tracking-ids.json' with { type: 'json' };

// This registry is append-only. Reordering it would change existing tracking links.
export const TRACKING_IDS = Object.freeze(trackingIds);
export const TRACKING_KEY = 'monsterdb.tried.v1';
export const SITE_URL = 'https://zigzageer.github.io/mosnterdb/';
const knownIds = new Set(TRACKING_IDS);

export function normalizeProfile(value = {}) {
  const selected = new Set(Array.isArray(value?.tried) ? value.tried.filter(id => knownIds.has(id)) : []);
  const name = typeof value?.name === 'string' ? [...value.name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0,28).join('') : '';
  return { name, tried: TRACKING_IDS.filter(id => selected.has(id)) };
}

export function sameProfile(a, b) {
  return JSON.stringify(normalizeProfile(a)) === JSON.stringify(normalizeProfile(b));
}

export function trackingHash(value) {
  const profile = normalizeProfile(value);
  const bits = new Uint8Array(Math.ceil(TRACKING_IDS.length / 8));
  const selected = new Set(profile.tried);
  TRACKING_IDS.forEach((id, index) => { if (selected.has(id)) bits[index >> 3] |= 1 << (index % 8); });
  const code = btoa(String.fromCharCode(...bits)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const params = new URLSearchParams({ tried:`v1.${code}` });
  if (profile.name) params.set('name', profile.name);
  return `#${params}`;
}

export function trackingLink(value) {
  return SITE_URL + trackingHash(value);
}

export function readTrackingHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/,''));
  if (!params.has('tried')) return null;
  try {
    const code = params.get('tried');
    if (hash.length > 1000 || !/^v1\.[A-Za-z0-9_-]+$/.test(code)) throw new Error('Invalid format');
    const encoded = code.slice(3);
    const raw = atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
    const canonical = btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    if (canonical !== encoded || !raw.length || raw.length > Math.ceil(TRACKING_IDS.length / 8)) throw new Error('Invalid data');
    const tried = [];
    for (let index=0;index<raw.length*8;index++) {
      if (raw.charCodeAt(index >> 3) & (1 << (index % 8))) {
        if (index >= TRACKING_IDS.length) throw new Error('Unknown entry');
        tried.push(TRACKING_IDS[index]);
      }
    }
    return { profile:normalizeProfile({ tried, name:params.get('name') || '' }) };
  } catch {
    return { error:'That tracking link could not be read. Your saved list is unchanged.' };
  }
}
