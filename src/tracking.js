import trackingIds from './tracking-ids.json' with { type: 'json' };

// This registry is append-only. Reordering it would change existing tracking links.
export const TRACKING_IDS = Object.freeze(trackingIds);
export const TRACKING_KEY = 'monsterdb.tried.v1';
export const SITE_URL = 'https://zigzageer.github.io/mosnterdb/';
const knownIds = new Set(TRACKING_IDS);

export function normalizeProfile(value = {}) {
  const selected = new Set(Array.isArray(value?.tried) ? value.tried.filter(id => knownIds.has(id)) : []);
  const name = typeof value?.name === 'string' ? [...value.name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0,28).join('') : '';
  const ratings = {};
  for (const id of TRACKING_IDS) {
    const rating = value?.ratings?.[id];
    if (selected.has(id) && Number.isInteger(rating) && rating >= 1 && rating <= 5) ratings[id] = rating;
  }
  return { name, tried: TRACKING_IDS.filter(id => selected.has(id)), ...(Object.keys(ratings).length ? {ratings} : {}) };
}

export function sameProfile(a, b) {
  return JSON.stringify(normalizeProfile(a)) === JSON.stringify(normalizeProfile(b));
}

function encodeBytes(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function decodeBytes(code, maxBits) {
  if (!/^v1\.[A-Za-z0-9_-]+$/.test(code)) throw new Error('Invalid format');
  const encoded = code.slice(3);
  const raw = atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
  if (encodeBytes(Uint8Array.from(raw, char=>char.charCodeAt(0))) !== encoded || !raw.length || raw.length > Math.ceil(maxBits/8)) throw new Error('Invalid data');
  for (let bit=maxBits;bit<raw.length*8;bit++) {
    if (raw.charCodeAt(bit >> 3) & (1 << (bit % 8))) throw new Error('Unknown entry');
  }
  return Uint8Array.from(raw, char=>char.charCodeAt(0));
}

export function trackingHash(value, {view} = {}) {
  const profile = normalizeProfile(value);
  const bits = new Uint8Array(Math.ceil(TRACKING_IDS.length / 8));
  const selected = new Set(profile.tried);
  TRACKING_IDS.forEach((id, index) => { if (selected.has(id)) bits[index >> 3] |= 1 << (index % 8); });
  const params = new URLSearchParams({ tried:`v1.${encodeBytes(bits)}` });
  if (profile.ratings) {
    const ratingBits = new Uint8Array(Math.ceil(TRACKING_IDS.length*3/8));
    TRACKING_IDS.forEach((id,index) => {
      const rating=profile.ratings[id] || 0;
      for(let bit=0;bit<3;bit++) if(rating & (1 << bit)) {
        const offset=index*3+bit;
        ratingBits[offset >> 3] |= 1 << (offset%8);
      }
    });
    params.set('r',`v1.${encodeBytes(ratingBits)}`);
  }
  if (profile.name) params.set('name', profile.name);
  if (view === 'left') params.set('view','left');
  return `#${params}`;
}

export function trackingLink(value, options) {
  return SITE_URL + trackingHash(value, options);
}

export function readTrackingHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/,''));
  if (!params.has('tried')) return null;
  try {
    if (hash.length > 1000) throw new Error('Invalid length');
    const raw=decodeBytes(params.get('tried'), TRACKING_IDS.length);
    const tried = TRACKING_IDS.filter((_,index)=>raw[index >> 3] & (1 << (index%8)));
    const ratings = {};
    if (params.has('r')) {
      const ratingBits=decodeBytes(params.get('r'),TRACKING_IDS.length*3);
      TRACKING_IDS.forEach((id,index)=>{
        let rating=0;
        for(let bit=0;bit<3;bit++) {
          const offset=index*3+bit;
          if(ratingBits[offset >> 3] & (1 << (offset%8))) rating |= 1 << bit;
        }
        if(rating>5)throw new Error('Invalid rating');
        if(rating)ratings[id]=rating;
      });
    }
    return { profile:normalizeProfile({tried,ratings,name:params.get('name') || ''}), view:params.get('view') === 'left' ? 'left' : 'tracker' };
  } catch {
    return { error:'That tracking link could not be read. Your saved list is unchanged.' };
  }
}
