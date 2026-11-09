# MonsterDB

A Monster-inspired Y2K can archive: acid green graphics, distressed oversized type, chrome accents, a three-can hero, and a searchable product grid. The catalog contains 86 flavor entries, each with a real sourced packaging photo. Includes family filters, sorting, can details, and collections saved in the current browser.

## GitHub Pages

The repository includes a static build in `docs/`. After the code is pushed:

1. Open the repository's **Settings → Pages**.
2. Select **Deploy from a branch**, branch **main**, folder **/docs**, and **Save**.
3. Wait for the GitHub Pages deployment to finish. The expected address is `https://zigzageer.github.io/mosnterdb/`.

This address is a publishing target until Pages is enabled and the deployment succeeds. Publishing a site does not require changing repository visibility. Private repositories may require a GitHub plan that supports Pages.

Regenerate the committed site after source changes:

```sh
npm ci --no-audit --no-fund
npm run build:pages
npm run test:pages
```

Commit and push the updated `docs/` files along with the source. `.nojekyll` lets Pages serve the Vite build directly. All asset paths are relative, so the app works at the repository subpath. No API keys or backend are needed; product photos and fonts are served locally.

## Development

Use Node.js 22.12+ and npm. Validated with Node.js 24.22.1. The repository `.npmrc` uses a writable project-local `.npm-cache`.

```sh
npm ci --no-audit --no-fund
npm run dev
```

The development server binds to port 5173. In the cloud environment, verify it with `curl -fsS http://127.0.0.1:5173/`. A cloud localhost address is not a public preview URL.

```sh
npm run build
npm test
```

Browser tests use `/usr/bin/chromium`; set `CHROMIUM_PATH` for the production Pages smoke test on another machine, and update Playwright's `executablePath` for its development suite. The suites cover every image, filters, search, sorting, collections, dialogs, keyboard focus, mobile layout, and the `/mosnterdb/` production path.

Each cloud task is already isolated. Use the existing checkout; do not create a Git worktree unless explicitly requested. Live server processes must be restarted after restoring an environment snapshot.

## Standalone export

`npm run export:standalone` creates the ignored `MonsterDB.html` with fonts, scripts, styles and images embedded. It can be saved to a computer and opened as a local document in a normal browser. The cloud browser's administrative policy blocks direct file navigation; the earlier export was tested as an offline, in-memory document instead. Browser storage restrictions can affect collection persistence on local files.

## Catalog and credits

`src/catalog.js` holds the flavor index. `src/image-manifest.json` records provenance for 75 added photos; the 11 original photos are credited in [SOURCES.md](SOURCES.md). Every current catalog entry has a packaging photo. Regional can sizes and redesigns vary, and the archive is not yet a complete history of every Monster release. No current/discontinued status or nutrition data is inferred from a photo.

Collections use `monsterdb.collection.v1` in localStorage. No account or cross-device sync is included. If storage is unavailable, changes work for the current visit and a status message explains that they were not persisted.

This independent fan project is not affiliated with Monster Energy. Product imagery and trademarks belong to their respective owners.
