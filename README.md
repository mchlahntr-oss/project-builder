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
