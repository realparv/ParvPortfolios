# Dashboard Chart + Data Sheet (React + Vite)

A responsive dashboard built with React (Vite) that matches a modern dark UI: top header, optional left sidebar, and a main card containing an interactive Chart.js line chart next to an editable/sortable data table.

- Tech: React 18, Vite 5, Chart.js via react-chartjs-2
- Features: interactive chart (tooltip, legend toggle), series visibility toggles, inline cell editing, sortable columns, download CSV, copy JSON to clipboard, export chart as PNG, live chart updates from table edits.
- Data: ships with `public/data-sheet.json` and `public/data-sheet.csv`.

## Quickstart

1) Install dependencies

```bash
npm install
```

2) Start dev server

```bash
npm run dev
```

3) Build for production

```bash
npm run build
npm run preview
```

Open the dev URL printed in your terminal (typically http://localhost:5173).

## Project Structure

- `index.html`: Vite entry
- `src/main.jsx`: React bootstrap
- `src/App.jsx`: Layout, Chart card, Data table
- `src/styles.css`: Global styles (CSS variables for colors/fonts)
- `public/data-sheet.json`: Default dataset consumed by the app
- `public/data-sheet.csv`: CSV version of the same dataset

## How it works

- On load, the app fetches `/data-sheet.json`. If it fails, it falls back to an inline sample dataset.
- The table renders the dataset rows and supports:
  - Sorting by clicking column headers.
  - Inline editing of labels and numeric values.
  - Add/remove rows.
  - Download CSV and Copy JSON buttons.
- The chart uses the exact data from the table. Editing cells updates the chart immediately.
- Toggle series visibility via:
  - The legend (click a legend label), and
  - The checkbox toggles above the chart.
- Export chart as PNG using the "Export PNG" button.

## Customize to match your screenshot

- Colors and fonts are controlled via CSS variables at the top of `src/styles.css`:

```css
:root {
  --bg: #0f172a;
  --panel: #111827;
  --muted: #6b7280;
  --text: #e5e7eb;
  --accent: #4f46e5;
  --accent-2: #06b6d4;
  --border: #1f2937;
  --card: #0b1220;
  --radius: 12px;
}
```

- If your screenshot uses specific brand colors or fonts, replace these values accordingly. You can also import a web font in `index.html` or via CSS if needed.
- Spacing, border radii, shadows and layout breakpoints are defined in `src/styles.css`.

## Data format

`public/data-sheet.json` structure:

```json
{
  "labels": ["Jan", "Feb", "Mar"],
  "series": [
    { "name": "Revenue", "data": [12, 19, 14] },
    { "name": "Expenses", "data": [8, 9, 10] }
  ]
}
```

- Add or remove series as needed.
- Colors are assigned automatically but can be set by adding a `color` field to a series, e.g.: `{ "name": "Revenue", "color": "#4F46E5", "data": [...] }`.

## Screenshots

- After you run the app, take screenshots and place them in a `screenshots/` folder (not required for running). Update this README with those images if desired.

## Notes

## Video Demo


- Keep dependencies minimal and stick to functional components and hooks.
- The table maintains correct edits even when sorted by tracking the original row index.

## License

MIT
