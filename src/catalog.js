// A growing flavor index, not an exhaustive list of every regional can or redesign.
// See SOURCES.md for image provenance and catalog limitations.
import imageSources from './image-manifest.json' with { type: 'json' };

export const assetUrl = file => `./cans/${file}`;
const seed = [
  ['Original Green', 'Original', 'Citrus · The original', '#a6dc43', 'original-green.webp'],
  ['Zero Ultra', 'Ultra', 'Light citrus · Zero sugar', '#e8e9df', 'ultra-zero-ultra.webp'],
  ['Mango Loco', 'Juiced', 'Mango · Tropical juice', '#f9b33c', 'mango-loco.webp'],
  ['Pipeline Punch', 'Juiced', 'Passion fruit · Orange · Guava', '#f9a8b7', 'pipeline-punch.webp'],
  ['Ultra Paradise', 'Ultra', 'Kiwi · Lime · Cucumber', '#a8e35b', 'ultra-paradise.png'],
  ['Pacific Punch', 'Juiced', 'Classic fruit punch', '#e9cf9d', 'pacific-punch.webp'],
  ['Khaotic', 'Juiced', 'Orange · Tropical citrus', '#fbb762', 'khaotic.webp'],
  ['Ultra Watermelon', 'Ultra', 'Watermelon · Zero sugar', '#f15b6e', 'ultra-watermelon.webp'],
  ['Papillon / Monarch', 'Juiced', 'Peach · Nectarine', '#f8bf95', 'papillon-monarch.webp'],
  ['The Doctor', 'Original', 'Citrus · VR46 edition', '#f1df56', 'the-doctor.webp'],
  ['Ultra Citron', 'Ultra', 'Citrus · Zero sugar', '#e0ee5b', 'ultra-citra.png'],
  ['Zero Sugar', 'Original', 'Classic energy · Zero sugar', '#96d349'],
  ['Lo-Carb', 'Original', 'Classic energy · Low carb', '#68c6dd'],
  ['Absolutely Zero', 'Original', 'Classic energy · Zero sugar', '#7bcee6'],
  ['Assault', 'Original', 'Cola-inspired energy', '#d96160'],
  ['Import', 'Original', 'Classic energy · Import edition', '#a5bd79'],
  ['Mule', 'Original', 'Ginger brew', '#c89563'],
  ['Lewis Hamilton Zero Sugar', 'Original', 'Peach · Nectarine', '#dfa19b'],
  ['Lewis Hamilton 44', 'Original', 'Signature edition', '#e14b4f'],
  ['Ultra Blue', 'Ultra', 'Blue berry · Zero sugar', '#73c8f4'],
  ['Ultra Red', 'Ultra', 'Berry · Zero sugar', '#eb6779'],
  ['Ultra Sunrise', 'Ultra', 'Orange · Zero sugar', '#f7a253'],
  ['Ultra Black', 'Ultra', 'Black cherry · Zero sugar', '#a86b8e'],
  ['Ultra Violet', 'Ultra', 'Grape · Zero sugar', '#bda0e2'],
  ['Ultra Fiesta Mango', 'Ultra', 'Mango · Zero sugar', '#66d7d4'],
  ['Ultra Gold', 'Ultra', 'Pineapple · Zero sugar', '#e3c274'],
  ['Ultra Peachy Keen', 'Ultra', 'Peach · Zero sugar', '#f2ab91'],
  ['Ultra Rosa', 'Ultra', 'Floral fruit · Zero sugar', '#ef9bbd'],
  ['Ultra Strawberry Dreams', 'Ultra', 'Strawberry · Zero sugar', '#f6b1c6'],
  ['Ultra Vice Guava', 'Ultra', 'Guava · Zero sugar', '#c4e79c'],
  ['Ultra Fantasy Ruby Red', 'Ultra', 'Ruby grapefruit · Zero sugar', '#f394bd'],
  ['Ultra Blue Hawaiian', 'Ultra', 'Tropical · Zero sugar', '#83dce1'],
  ['Ultra Wild Passion', 'Ultra', 'Passion fruit · Zero sugar', '#cc9edc'],
  ['Khaos', 'Juiced', 'Orange juice blend', '#ea9857'],
  ['Ripper / M-80', 'Juiced', 'Tropical fruit juice', '#e6d853'],
  ['Mixxd', 'Juiced', 'Mixed fruit punch', '#b277ad'],
  ['Baller’s Blend', 'Juiced', 'Fruit punch', '#d57478'],
  ['Mad Dog', 'Juiced', 'Grape · Tropical punch', '#bb8acb'],
  ['Aussie Style Lemonade', 'Juiced', 'Lemonade', '#76cddf'],
  ['Rio Punch', 'Juiced', 'Tropical fruit punch', '#a6cf8b'],
  ['Bad Apple', 'Juiced', 'Apple juice', '#b4d894'],
  ['White Pineapple', 'Reserve', 'Pineapple', '#e0d6a9'],
  ['Watermelon', 'Reserve', 'Watermelon', '#ec8693'],
  ['Orange Dreamsicle', 'Reserve', 'Orange · Cream', '#ffc18d'],
  ['Peaches N’ Creme', 'Reserve', 'Peach · Cream', '#f7bfa5'],
  ['Kiwi Strawberry', 'Reserve', 'Kiwi · Strawberry', '#d7dd8f'],
  ['Super Dry', 'Nitro', 'Citrus · Nitrous-infused', '#a5d764'],
  ['Cosmic Peach', 'Nitro', 'Peach · Nitrous-infused', '#f4ac84'],
  ['Nitrous Killer-B', 'Nitro', 'Historical Nitrous edition', '#e6cc69'],
  ['Nitrous Anti Gravity', 'Nitro', 'Historical Nitrous edition', '#a9c4d8'],
  ['Nitrous Super Dry', 'Nitro', 'Historical Nitrous edition', '#9dd891'],
  ['Mean Bean', 'Java', 'Coffee · Vanilla bean', '#c4ab89'],
  ['Loca Moca', 'Java', 'Coffee · Chocolate', '#bd947e'],
  ['Salted Caramel', 'Java', 'Coffee · Salted caramel', '#d8b17d'],
  ['Irish Blend', 'Java', 'Coffee · Irish cream flavor', '#a4bd9d'],
  ['Kona Blend', 'Java', 'Coffee · Kona blend', '#c49679'],
  ['Vanilla Light', 'Java', 'Coffee · Vanilla', '#dcd1aa'],
  ['Swiss Chocolate', 'Java', 'Coffee · Chocolate', '#b69c8e'],
  ['Toffee', 'Java', 'Coffee · Toffee', '#d0b394'],
  ['Irish Crème', 'Java', 'Coffee · Cream', '#abc3a4'],
  ['Café Latte', 'Java', 'Coffee · Milk', '#ddc7ac'],
  ['Triple Shot French Vanilla', 'Java', 'Coffee · French vanilla', '#d7ceb6'],
  ['Triple Shot Mocha', 'Java', 'Coffee · Mocha', '#bd9c88'],
  ['Cold Brew Latte', 'Java', 'Cold brew · Latte', '#cebfa9'],
  ['Cold Brew Sweet Black', 'Java', 'Cold brew · Sweet black', '#a28a78'],
  ['Lemonade + Tea', 'Rehab', 'Tea · Lemonade', '#e8d37c'],
  ['Peach Tea', 'Rehab', 'Tea · Peach', '#edb288'],
  ['Raspberry Tea', 'Rehab', 'Tea · Raspberry', '#df92aa'],
  ['Strawberry Lemonade', 'Rehab', 'Strawberry · Lemonade', '#f1acb0'],
  ['Wild Berry Tea', 'Rehab', 'Tea · Wild berry', '#b9a3d9'],
  ['Green Tea', 'Rehab', 'Green tea', '#aecb8a'],
  ['Orangeade', 'Rehab', 'Orangeade', '#e9b274'],
  ['Pink Lemonade', 'Rehab', 'Pink lemonade', '#edb1c4'],
  ['Rojo Tea', 'Rehab', 'Red tea blend', '#c08283'],
  ['Protean', 'Rehab', 'Historical Rehab edition', '#a9aaa1'],
  ['Tropical Thunder', 'Hydro', 'Tropical fruit · Hydration', '#e5c070'],
  ['Manic Melon', 'Hydro', 'Melon · Hydration', '#a8d6ab'],
  ['Mean Green', 'Hydro', 'Green fruit · Hydration', '#9ec77f'],
  ['Blue Ice', 'Hydro', 'Blue fruit · Hydration', '#84bfd8'],
  ['Purple Passion', 'Hydro', 'Passion fruit · Hydration', '#b29acb'],
  ['Zero Sugar Hydro', 'Hydro', 'Hydration · Zero sugar', '#bfccd1'],
  ['Cuba-Lima', 'Original', 'Lime · Cola', '#abc075'],
  ['Unleaded', 'Original', 'Historical caffeine-free edition', '#a7bc9b'],
  ['Heavy Metal', 'Original', 'Historical edition', '#a3bb8e'],
  ['Monster M3', 'Original', 'Concentrated energy', '#b2c76e'],
  ['Extra Strength Super Dry', 'Nitro', 'Historical Extra Strength edition', '#bdd493'],
  // Current U.S. listing additions. Keep existing entries and tracking identities stable.
  ["Vanilla Shot", "Original", "Vanilla · Classic energy", "#b9d788"],
  ["Zero Sugar Vanilla Shot", "Original", "Vanilla · Zero sugar", "#b9d788"],
  ["Lando Norris", "Original", "Melon · Yuzu", "#b9d788"],
  ["Strawberry Shot", "Original", "Strawberry · Classic energy", "#b9d788"],
  ["Zero Sugar Strawberry Shot", "Original", "Strawberry · Zero sugar", "#b9d788"],
  ["Electric Blue", "Original", "Blue raspberry", "#b9d788"],
  ["Original Orange Dreamsicle", "Original", "Orange · Cream", "#b9d788"],
  ["Ultra Red White Blue Razz", "Ultra", "Blue raspberry · Zero sugar", "#5798ff"],
  ["Ultra Punk Punch", "Ultra", "Fruit punch · Zero sugar", "#ff4a9a"],
  ["Dubai Chocolate", "Java", "Coffee · Chocolate · Pistachio", "#b6ba77"],
  ["Killer Brew Loca Moca", "Java", "Coffee · Mocha", "#b9d788"],
  ["Killer Brew Mean Bean", "Java", "Coffee · Vanilla bean", "#b9d788"],
  ["Voodoo Grape", "Juiced", "Grape · Juice blend", "#b987e3"],
  ["Juiced Strawberry Lemonade", "Juiced", "Strawberry · Lemonade", "#f5b0bc"],
  ["Viking Berry", "Juiced", "Mixed berry · Juice blend", "#adc0df"],
];

export const catalog = seed.map(([name, family, flavor, color, image], index) => {
  const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  const sourced = imageSources[id];
  return {
  id,
  number: String(index + 1).padStart(3, '0'),
  name, family, flavor, color,
  image: sourced ? assetUrl(sourced.file) : image ? assetUrl(image) : null,
  imageSource: sourced?.originalImageUrl || null,
  source: sourced?.productUrl || 'https://www.monsterenergy.com/en-us/energy-drinks/',
};});

export const families = ['Original', 'Ultra', 'Juiced', 'Java', 'Rehab', 'Reserve', 'Nitro', 'Hydro'];

// One livery colour per family, used by the filter chips, card labels and progress bars.
export const familyLivery = {
  Original: '#a2f500', Ultra: '#dfe9ef', Juiced: '#ff9a1f', Java: '#d9a366',
  Rehab: '#ffd91a', Reserve: '#ff5d7c', Nitro: '#b48cff', Hydro: '#31d2ff',
};

export function filterCatalog({ query = '', family = 'All', photos = false, collection = false, saved = [], sort = 'shelf' } = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = catalog.filter(can => {
    const text = `${can.name} ${can.family} ${can.flavor}`.toLocaleLowerCase();
    return terms.every(term => text.includes(term)) && (family === 'All' || can.family === family)
      && (!photos || can.image) && (!collection || saved.includes(can.id));
  });
  if (sort === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'za') result.sort((a, b) => b.name.localeCompare(a.name));
  return result;
}
