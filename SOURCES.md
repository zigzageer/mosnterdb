# Catalog and image sources

The requested reference is the [official Monster Energy U.S. drinks catalog](https://www.monsterenergy.com/en-us/energy-drinks/). Direct access from the onboarding environment returned a network-policy 403 on November 8, 2026. Domains were proposed in the environment draft; direct official sourcing remains pending until access is applied and verified.

## Product photos

The following existing product packshots were retrieved from public GitHub archives on November 8, 2026. No application code was reused. These photos depict Monster Energy packaging; artwork, photography, and trademarks remain the property of their respective owners. Repository accessibility does not grant a separate license to the underlying brand artwork.

| Local file | Retrieved from |
| --- | --- |
| original-green.webp | rick-btw/beast-rank, public/cans |
| ultra-zero-ultra.webp | rick-btw/beast-rank, public/cans |
| mango-loco.webp | rick-btw/beast-rank, public/cans |
| pipeline-punch.webp | rick-btw/beast-rank, public/cans |
| pacific-punch.webp | rick-btw/beast-rank, public/cans |
| khaotic.webp | rick-btw/beast-rank, public/cans |
| ultra-watermelon.webp | rick-btw/beast-rank, public/cans |
| papillon-monarch.webp | rick-btw/beast-rank, public/cans |
| the-doctor.webp | rick-btw/beast-rank, public/cans |
| ultra-paradise.png | this-sangyeon/monsterDrink, img/drink |
| ultra-citra.png | this-sangyeon/monsterDrink, img/drink |

Source repositories: https://github.com/rick-btw/beast-rank and https://github.com/this-sangyeon/monsterDrink. Local files retain the source filenames. The regional `ultra-citra` filename is indexed as Ultra Citron; regional naming needs further verification.

All remaining cans are original CSS illustrations and are labeled as illustrations in the catalog and details. Their colors are decorative and must not be used as packaging evidence.

## Scope

The flavor index is a manually assembled starter catalog, not a completeness claim. Descriptors are concise flavor summaries, not official ingredient lists or nutritional claims. The official U.S. page alone does not establish historical or worldwide coverage. Release years, production status, regional availability, and health claims are intentionally not asserted. The Papillon/Monarch entry combines closely related regional names; the archive is currently organized by flavor, not every can size or packaging redesign.

## Fonts

Barlow Condensed and DM Sans are distributed by their respective Fontsource packages under the SIL Open Font License; package license files are retained in node_modules and fonts are bundled locally by Vite.

## Expanded photo research and Y2K redesign

The catalog now has 86 entries with 86 sourced packaging photos. The original 11 credits above are retained. Another 31 product photos were obtained from the public [forsmark/monster-mash flavor dataset](https://github.com/forsmark/monster-mash/blob/main/src/data/flavors.json), which records official Monster product pages and original `web-assests.monsterenergy.com` packshot URLs. These links are preserved in `src/image-manifest.json`; direct access to the official image host has not been verified in this environment.

The remaining 44 historical, regional, Reserve, Hydro and Java photos were obtained from [fabio-secchiari/monster-collector](https://github.com/fabio-secchiari/monster-collector), using its `catalog.js` product records to match packaging. Each local file, upstream photo path, source catalog and identification limitation is recorded in `src/image-manifest.json`. Existing saved images were reused; no images were invented. A few upstream files had misleading extensions; local extensions were corrected to match their actual PNG/WebP format without modifying image content.

The archive displays representative packaging per indexed flavor. Hydro includes original bottle and can formats, and regional/history labels are based on the source collector catalog. Product photos do not establish release dates, ingredients, current availability, or that this flavor index covers every packaging variant. The original vague "Monster Extra Strength" record was clarified to the photographed "Extra Strength Super Dry" edition.

The redesign uses original HTML, CSS, graphics and interaction code. No application code was copied from the research repositories. Anton and Space Mono were added from Fontsource under the SIL Open Font License, alongside Barlow Condensed and DM Sans. No font depends on an external CDN at runtime.


## Current U.S. additions and image audit

The flavor index now contains 101 entries with photos. Fifteen additional U.S. listings were added from a freshly fetched copy of the public `forsmark/monster-mash` dataset, including Ultra Red White Blue Razz, Ultra Punk Punch, Vanilla/Strawberry Shot variants, Lando Norris, Electric Blue, core Orange Dreamsicle, Dubai Chocolate, Killer Brew variants, Voodoo Grape, Juiced Strawberry Lemonade and Viking Berry. All 52 packshots in that public dataset were downloaded again for audit, and the 15 newly published files matched those downloads. `src/official-us-index.json` records coverage and retrieval metadata; `src/image-manifest.json` records image and product source URLs.

Direct HTTPS requests to the Monster website still returned a destination-policy 403. Public dataset retrieval is distinct from a fresh official-site scrape; neither the 52 U.S. records nor the complete 101-entry index proves worldwide historical completeness. A reusable scraper and a public-snapshot download mode are included in `scripts/scrape-official.py`.

Rehab Strawberry Lemonade's photo was corrected to the historical Rehab packaging from the collector dataset. The current Juice Monster Strawberry Lemonade has its own entry and official-source packshot. Ultra Red and Ultra Red White Blue Razz remain separate flavors.

Share cards are generated locally from these same packaging files using Canvas and locally hosted fonts. QR codes encode the user's selected list and optional name as a website fragment. The sample card in `screenshots/` uses an example profile, not user data. QR generation uses the MIT-licensed node-qrcode package; QR decoding in tests uses jsQR and is not shipped to the browser.
