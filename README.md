# hackmate.

A calm, pastel-mint home for every hackathon you build — track ideas, deadlines, submissions and wins in one soft, eye-friendly dashboard.

![Pastel mint interface](https://img.shields.io/badge/ui-pastel%20mint-b9efd9?style=flat-square&labelColor=123c32)

## What's inside

- **Overview** — headline stats, a "next up" hero with live countdown, deadline radar, and recent hackathon cards.
- **My hackathons** — search, status filters, sorting, favorites, and inline add/edit/delete.
- **Calendar** — month grid with colour-coded events, month navigation, and a horizon list of what's coming.
- **Insights** — six-month activity chart, status donut, format split, theme cloud and podium reel.
- **Your data** — export a JSON backup, import one, or reset to the sample season (sidebar → *Your data*).

Everything is local-first: your hackathons live in `localStorage` under `hackmate.events.v1`, with a set of sample events loaded on first run. Saves are validated on load, so a hand-edited or half-written file can never blank out a view.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually <http://localhost:5173>).

To run the production build — which also registers the service worker, so the installed app opens without a network connection:

```bash
npm run build
npm run preview
```

## Install it

The app ships a web manifest and icons, so Chrome/Edge can install it as a standalone window (*Install Hackmate* from the address bar), and iOS can add it to the home screen. The service worker precaches the shell and keeps the last-seen assets, so the installed app still opens offline.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `N` | Add a new hackathon |
| `/` | Focus the global search |
| `Esc` | Close the open panel |
| `Tab` | Cycle inside an open panel (focus is trapped, then returned) |
| `Enter` / `Space` | Open the focused hackathon card |

## Stack

React 19 · TypeScript · Vite · hand-written CSS · lucide-react icons · Fraunces + DM Sans.

## Notes

- Data is stored only in your browser. Clearing site data resets the sample set; export a backup first if it matters.
- The layout adapts from wide desktop down to a 390 px phone, with a slide-out sidebar below 1024 px and a collapsible search field on small screens.
- Motion respects `prefers-reduced-motion`.
