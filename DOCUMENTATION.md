# BioQuest — Documentation

BioQuest is a static single-page application (SPA) to explore a curated dataset of NASA-funded research projects across bioscience and physical sciences. It includes an interactive network visualization, a project table, filtering controls, and a trend chart.

Files
- `index.html` — app entry point
- `css/styles.css` — Visual theme and responsive layout
- `js/data.js` — Sample dataset (array of project objects)
- `js/app.js` — App logic: rendering, filters, D3 visualizations
- `public/vite.svg` — App icon

Dataset Schema
```javascript
{
  id: Number,
  title: String,
  piName: String,
  institution: String,
  topic: String,
  year: Number,
  description: String
}
```

How it works
- On load, the app reads `window.BioQuestData.projects` (provided by `js/data.js`).
- It extracts available topics and years and populates the filter controls.
- `renderGraph()` creates a D3 force-directed graph showing projects, PIs, institutions, and topics as nodes.
- Clicking a project node or 'View' button opens the detail pane.

Customizing data
- Edit `js/data.js` and add new project objects to the `projects` array. After saving, reload the page in your browser.

Using real NASA data
- Replace or merge `window.BioQuestData.projects` with data fetched from NASA APIs or converted JSON.

Future work
- Add export (CSV/JSON) features
- Add advanced analytics and clustering
- Improve accessibility and keyboard navigation
- Replace sample dataset with dynamic fetch and caching
