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
js/seed.js              First-launch data (settings, exercises, "Upper")
js/lib/                 Pure, testable logic (dates, model/defaults)
js/ui/                  DOM helper, shell (tabs/sheet/toast), theme
js/views/               One module per screen
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

## iOS Shortcut: copy today's steps

The shortcut reads today's steps from Health and copies `MOVE_STEPS|YYYY-MM-DD|NUMBER` to the clipboard. Move's **Paste steps** button reads it.

### Create the shortcut
1. Open **Shortcuts** → **+** (top right). Tap the title and rename it **Move steps**.
2. Add action **Find Health Samples**:
   - *Type*: **Steps**
   - Add filter **Start Date** → **is today**
   - *Group By*: **Day**  (gives one daily total, like the Health app)
3. Add action **Calculate Statistics** → **Sum** of *Health Samples*.
4. Add action **Round Number** → *Statistics Result*, to **Ones Place**.
5. Add action **Format Date** → *Current Date*, *Date Format*: **Custom**, format string: `yyyy-MM-dd`, *Time Format*: **None**.
6. Add action **Text** and type `MOVE_STEPS|`, insert variable *Formatted Date*, type `|`, insert variable *Rounded Number*. No spaces.
7. Add action **Copy to Clipboard** → *Text*.
8. Tap **▶** once. iOS asks for Health access → **Allow**. Open Move → **Paste steps**. Compare the number with the Health app the first time.

### Run it every evening at 21:00
1. Shortcuts → **Automation** tab → **+** → **Time of Day**.
2. **21:00**, *Repeat*: **Daily**, select **Run Immediately** (and turn off *Notify When Run* if you like) → **Next**.
3. Choose **Move steps** → **Done**.
4. Later that evening, open Move → **Paste steps**.

Notes
- Health data is protected while the iPhone is locked, so an automation that fires on a locked phone may read 0 or fail. Move never silently replaces a higher count with a lower one: it asks first. If that happens, run the shortcut manually.
- If you copy something else after 21:00, just run the shortcut again before pasting.
- The first paste may show an iOS **Paste** bubble: tap it. Move then reads the clipboard.

## Reviewing on a computer
Open `https://<your-username>.github.io/move/?preview` to bypass the install screen. Data entered that way stays in that browser only.

## Accessibility notes
All accent colours meet WCAG AA (≥ 4.5:1) against their backgrounds in both themes:
dark accents on `#1C1C21` cards: 6.0–10.8:1; light accents on `#F2F2F5`: 4.8–5.7:1.
