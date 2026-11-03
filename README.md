# Move

Personal PWA for training, habits and steps. Static files only — no build step.

## Folder structure

```
index.html              App shell (install screen, views, tab bar, sheet layer)
manifest.webmanifest    PWA manifest
sw.js                   Service worker (offline-first, versioned cache)
css/tokens.css          Design tokens: colours, spacing, radius, type, motion
css/base.css            Reset, app frame, views, tab bar, install screen
css/components.css      Cards, buttons, chips, lists, sheet, banner, toast
js/app.js               Entry point
js/version.js           APP_VERSION
js/strings.js           All UI strings (add a French table later)
js/pwa.js               Standalone detection, SW registration + update banner
js/db.js                IndexedDB wrapper
js/repo.js              Data access used by the views
js/seed.js              First-launch data (settings, exercises, "Upper")
js/lib/                 Pure, testable logic (dates, model, week, scores, workout)
js/ui/                  DOM helper, shell (tabs/sheet/toast), stack navigation, theme
js/views/               Today, workout, templates, calendar, quick logs, settings
icons/                  App icons (apple-touch-icon 180×180, 192, 512, maskable)
tests/lib.test.mjs      Unit tests for js/lib (run on a computer: node tests/lib.test.mjs)
```

## Deploy on GitHub Pages (website only)

1. On github.com, top-right **+** → **New repository**. Name it `move`, set it to **Public** (free GitHub Pages needs a public repo on the free plan), tick nothing else, **Create repository**.
2. On the empty repo page, click **uploading an existing file**.
3. Unzip `move.zip` on your computer, open the `move` folder, select **everything inside it** (files *and* folders: `index.html`, `css`, `js`, `icons`, …) and drag it into the upload area. Folders keep their structure.
4. Scroll down, **Commit changes**.
5. **Settings** → **Pages** (left menu) → *Source*: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**.
6. Wait 1–2 minutes and refresh: the page shows *Your site is live at* `https://<your-username>.github.io/move/`.

### Updating later
Upload the changed files (or the whole unzipped folder again) the same way (same names overwrite). Before uploading, bump the version in **both** `sw.js` (`VERSION`) and `js/version.js` (`APP_VERSION`), otherwise the app keeps serving the old cached files. The installed app then shows *New version available — Reload*.

## Install on iPhone

1. In DuckDuckGo (or anywhere), copy the URL `https://<your-username>.github.io/move/`.
2. Open **Safari**, paste the URL, open it. You'll see the *Install Move* screen — that's expected.
3. Tap **Share** (square with arrow) → scroll → **Add to Home Screen** → keep the name *Move* → **Add**.
4. Open Move **from the Home Screen icon** only. Data lives in the installed app's own storage, not in Safari or DuckDuckGo.

## Reviewing on a computer
Open `https://<your-username>.github.io/move/?preview` to bypass the install screen. Data entered that way stays in that browser only.

## Accessibility notes
All accent colours meet WCAG AA (≥ 4.5:1) against their backgrounds in both themes:
dark accents on `#1C1C21` cards: 6.0–10.8:1; light accents on `#F2F2F5`: 4.8–5.7:1.
