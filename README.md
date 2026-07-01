# Card Generator

A web-based trading card creator. Design custom cards with images, stats, and powers, then print them in a double-sided layout (6 per page).

## Features

- Create and edit trading cards with name, rarity, type, image, stats, and powers
- Upload card front images and back designs via drag-and-drop or file picker
- Live card preview while editing
- Set number of copies per card
- Print view: arranges cards 6 per page (3x2 grid), with backs on the following page rotated 180° for double-sided printing
- All data saved to browser localStorage

## Development

The site itself has no build step — the deployable files live in `dist/`.
Tooling is used only for linting and formatting.

```bash
npm install        # install dev tools (ESLint, Prettier)
npm run lint       # lint dist/ with ESLint
npm run format     # auto-format all files with Prettier
npm run format:check  # verify formatting without writing
npm run check      # lint + format check (what CI runs)
```

Linting and formatting are enforced in CI via
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) on every push to
`main` and every pull request.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. In the Cloudflare dashboard, create a new Pages project linked to the repo
3. No build step needed — set the output directory to `dist`
