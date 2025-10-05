# BioQuest — NASA Research Knowledge Graph

A static, interactive dashboard to explore NASA-funded bioscience and physical science research projects. Built with HTML, CSS, JavaScript and D3.js.

Quick start

Project structure

Notes

BioQuest is a static, interactive dashboard to explore a curated dataset of NASA-funded research projects across bioscience and physical sciences. It includes an interactive network visualization, a project table, filtering controls, and a trend chart. Built with HTML, CSS, JavaScript and D3.js.

Table of contents
- Quick start
- Project structure
- Dataset schema
- How it works
- Customizing data
- Using real NASA data
- Notes
- License

## Quick start
1. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
2. Use the topic/year filters and search box to narrow results.
3. Drag nodes in the network graph. Click a project node or 'View' to see details.

For a consistently correct experience (CORS/relative asset resolution) serve the folder with a static server. Example (Windows cmd):

```cmd
cd /d d:\VSCODE\nasa_space_app
python -m http.server 8000

# then open http://localhost:8000
```

## Project structure
- `index.html` — main app entry
- `css/styles.css` — Visual theme and responsive layout
- `js/app.js` — App logic: rendering, filters, D3 visualizations
- `js/data.js` — Sample dataset (array of project objects)
- `public/vite.svg` — App icon

## Dataset schema
Each project in `js/data.js` follows this shape:

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

## How it works
- On load, the app reads `window.BioQuestData.projects` (provided by `js/data.js`).
- It extracts available topics and years and populates the filter controls.
- `renderGraph()` creates a D3 force-directed graph showing projects, PIs, institutions, and topics as nodes. Nodes are draggable, and the SVG supports zoom.
- Clicking a project node or the 'View' button opens the detail pane with more information.

## Customizing data
- Edit `js/data.js` and add new project objects to the `projects` array. After saving, reload the page in your browser.

### Adding new projects
Add a project object to the `projects` array with a unique `id` and the schema above. For example:

```javascript
{
	id: 16,
	title: "Your Project Title",
	piName: "Dr. Your Name",
	institution: "Your Institution",
	topic: "Your Topic",
	year: 2024,
	description: "Project description"
}
```

## Using real NASA data
To integrate real NASA data, replace or augment `window.BioQuestData.projects` by fetching from an API and setting `state.projects`, then re-render:

```javascript
async function fetchNASAProjects(){
	const response = await fetch('YOUR_NASA_API_ENDPOINT');
	const data = await response.json();
	state.projects = data;
	state.filtered = data;
	// re-run setup pieces
	extractFacets(); populateControls(); renderTable(); renderTrend(); renderGraph();
}
```

Suggested sources:
- NASA Task Book: https://taskbook.nasaprs.com/
- NASA Open Data: https://data.nasa.gov/
- NASA Technical Reports: https://ntrs.nasa.gov/

## Notes
- Filtering: topic + year + free-text search are combined. Search matches title, PI, institution, topic and description.
- Data volume: current in-memory rendering is fine for dozens to hundreds of items. For larger datasets, consider server-side filtering, pagination, or Web Workers.
- Accessibility: basic ARIA is minimal — consider keyboard navigation and focus management for production.

## License
MIT-style for demo purposes.
