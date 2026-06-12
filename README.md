# House Project Tracker

A mobile-first project tracker for house work, built as an installable Progressive Web App.

## What it tracks

- Projects by property, including budget and notes
- Tasks by project, area, priority, status, due date, and notes
- Budget/expense items by project, category, paid/planned status, date, and vendor
- Weekly priority view for high-priority and due-soon tasks
- Local device storage with JSON export/import backup
- Offline support after first load

## How to run locally

Open `index.html` in a browser.

For the installable/offline PWA behavior, serve the folder from a simple local server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## How to put it on your phone

1. Upload this folder to any static host such as Netlify, Vercel, GitHub Pages, Cloudflare Pages, or your own web server.
2. Open the hosted URL in Safari on iPhone or Chrome on Android.
3. Use "Add to Home Screen".

## Notes

This version stores data locally on the device. It does not use a database, login system, or cloud sync. Use Settings → Export backup JSON before changing phones or clearing browser data.

## Updating an existing GitHub Pages install without deleting data

This app stores project/task/budget data in the browser using the same local storage key: `houseProjectTracker.v1`. Updating the files in the same GitHub repository and keeping the same Pages URL should preserve existing data.

Before updating, open the app and use Export Backup. Save the JSON file somewhere safe.

To update GitHub Pages:
1. Unzip the latest app package.
2. Open the existing GitHub repository. Do not create a new repository and do not rename the old one.
3. Upload/replace these files at the repository root: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, and `service-worker.js`.
4. Commit the changes to the same branch used for GitHub Pages, usually `main`.
5. Open the existing Pages URL on your phone. If the old version still shows, close the browser/app completely and reopen it, or refresh the page.

Avoid clearing browser/site data unless you have exported a backup first. Clearing site data can remove the local project list.

## Mobile scaling fix included

This version locks the mobile viewport, prevents horizontal overflow, disables mobile text auto-resizing, and keeps form fields at a 16px font size to prevent iPhone input-focus zoom.


## v3 mobile zoom fix

This version adds a stricter iOS/Safari focus-zoom fix. Every editable field is forced to a 16px computed font size, the viewport lock is reasserted when a field receives focus, and the service worker cache is bumped to `house-project-tracker-v3`. The app data storage key remains unchanged, so replacing the files at the same GitHub Pages URL should preserve existing local data.


## v5 no-zoom hardening

This version adds a stronger mobile zoom lock. It uses a stricter viewport tag, blocks pinch gestures and double-tap zoom events where browsers permit it, re-locks the viewport on focus/orientation changes, and keeps all editable controls at 16px or larger. The app data storage key remains `houseProjectTracker.v1`, so replacing files at the same GitHub Pages URL should preserve existing local data.


## Version note

This v5 build keeps the same local storage key (`houseProjectTracker.v1`) and only changes mobile viewport/safe-area behavior. Uploading these files over the existing GitHub Pages files should not erase app data. Export a backup first as a precaution.


## v6 layout fix
This version keeps the same local data storage key (`houseProjectTracker.v1`) and extends the bottom navigation/background through the iPhone safe-area/home-indicator region to remove the white gap below the menu.


## v7 iPhone bottom gap fix

This version pins the app shell to the full viewport with `inset: 0`, fixes the bottom navigation to `bottom: 0`, extends the dark background behind the iPhone safe area, and avoids writing `window.innerHeight` into the layout because that can create a white strip near the home indicator. The data storage key remains `houseProjectTracker.v1`.


## v8 bottom-gap diagnostic sweep

This build changes the app shell from a fixed/floating bottom nav to a flex layout where the bottom menu is part of the full-height app. It also changes the PWA `background_color` from light beige to dark green so iPhone cannot expose a light safe-area strip behind the app. The CSS/JS files are cache-busted with `?v=10`, and the service worker now uses network-first loading for HTML so future updates are less likely to get stuck behind an old cache.

After uploading, open the app URL with `?v=10` once, such as `https://yourname.github.io/house-project-tracker/index.html?v=10`. Then open Settings and confirm it says `Build v11`. Your data key remains `houseProjectTracker.v1`.


## v11 edge-to-edge bottom dock

This build stops using a calculated JavaScript app height for the main shell. The shell is now pinned with `top: 0` and `bottom: 0`, so the browser stretches it to the full available iPhone screen instead of relying on a viewport height value that can be reported too short. The bottom nav no longer adds extra safe-area padding that can look like unused space below the menu. The storage key remains `houseProjectTracker.v1`.

After uploading, open `index.html?v=10` once and confirm Settings says `Build v11`.


## v12 hard bottom pull

This build confirms the bottom issue is not cached code. The app now uses a hard iOS bottom pull: on WebKit/iPhone it extends the app shell below the visible viewport and clips the extra portion, leaving only a compact 72px dock visible at the physical bottom of the screen. Settings also includes viewport diagnostics so the exact nav/shell measurements can be checked if the issue persists.

After uploading, open `index.html?v=12` once and confirm Settings says `Build v12 · hard bottom pull + diagnostics`.
