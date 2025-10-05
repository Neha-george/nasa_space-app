# BioQuest: NASA Research Knowledge Graph

🚀 An interactive dashboard for exploring NASA-funded bioscience and physical science research projects.

## Features

- **Interactive Network Graph**: Visualize connections between projects, PIs, institutions, and research topics
- **Project Table**: Browse detailed information about research projects
- **Advanced Filtering**: Filter by research topics and search by keywords
- **Trend Analysis**: View research trends over time
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **HTML5**: Semantic structure and layout
- **CSS3**: Styling, animations, and responsive design
- **JavaScript (ES6+)**: Interactive functionality and data processing
- **D3.js**: Data visualization and network graphs

## Quick Start

1. **Start a local server** (Python example):
   ```bash
   cd d:\VSCODE\nasa
   python -m http.server 8000
   ```

2. **Or use Node.js**:
   ```bash
   npx serve -s .
   ```

3. **Open your browser** to `http://localhost:8000`

No build process required - runs directly from source files!

## Project Structure

```
d:\VSCODE\nasa\
├── index.html           # Main application entry point
├── css/
│   └── styles.css       # Complete styling and NASA theme
├── js/
│   ├── app.js          # Main application logic
│   └── data.js         # Project dataset and graph builder
├── public/
│   └── vite.svg        # Application icon
└── DOCUMENTATION.md    # Complete technical documentation
```

## Dataset

The application includes a curated dataset of 15 NASA research projects spanning multiple disciplines:

### Sample Projects Include:
- **Exoplanet Biosignatures** (Dr. Alice Bennett, Caltech, 2021)
- **Mars Subsurface Hydrology** (Dr. Rahul Singh, JPL, 2019)
- **Deep Space Radiation Biology** (Dr. Emily Carter, Johns Hopkins, 2023)
- **Cryo-ecosystems on Europa** (Dr. Kenji Watanabe, Tokyo Tech, 2024)

### Research Topics Covered:
- Astrobiology
- Mars Science
- Human Health
- Planetary Protection
- Ocean Worlds
- ISRU (In-Situ Resource Utilization)
- Remote Sensing
- Astrochemistry
- Geobiology

### Dataset Schema:
```javascript
{
  id: 1,
  title: "Project Title",
  piName: "Dr. Principal Investigator",
  institution: "Research Institution",
  topic: "Research Topic",
  year: 2024,
  description: "Detailed project description"
}
```

## Data Sources

For production use with real NASA data:

1. **NASA Task Book**: https://taskbook.nasaprs.com/
2. **NASA Open Data**: https://data.nasa.gov/
3. **NASA Technical Reports**: https://ntrs.nasa.gov/
4. **Custom Data**: Update `js/data.js` with your dataset

## Customization

### Adding New Projects

Edit `js/data.js` and add new project objects to the `projects` array:

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

### Styling

Modify `css/styles.css` to customize:
- NASA color palette (CSS variables)
- Component layouts and spacing
- Animations and transitions
- Responsive breakpoints

### JavaScript Components

Each function in `js/app.js` handles specific functionality:
- `renderGraph()`: D3 network visualization
- `renderTable()`: Project data table
- `renderTrend()`: Year-based trend chart
- `applyFilters()`: Search and topic filtering

## Deployment

### Static Deployment

No build process required! Simply upload all files to any web server:

### Deploy Options

- **Netlify**: Drag and drop the entire project folder
- **Vercel**: Connect your GitHub repo (auto-detects static site)  
- **GitHub Pages**: Upload files to gh-pages branch
- **AWS S3**: Static website hosting
- **Any HTTP Server**: Apache, nginx, or simple Python server

## NASA Data Integration

To integrate real NASA data:

1. **Task Book API**: If available, create API service
2. **Web Scraping**: Use tools like Puppeteer or Scrapy
3. **Manual Import**: Convert PDF/Excel data to JSON format

### Sample API Integration

```javascript
// Add to js/app.js
async function fetchNASAProjects() {
  const response = await fetch('YOUR_NASA_API_ENDPOINT');
  const data = await response.json();
  // Update the projects array and re-render
  state.projects = data;
  state.filtered = data;
  renderTable();
  renderTrend();
  renderGraph();
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for hackathons, research, or educational purposes.

## Hackathon Tips

- **Quick Setup**: Project ready to run in minutes
- **Easy Customization**: All components are modular
- **Data Flexibility**: Easy to swap in real data
- **Presentation Ready**: Professional UI suitable for demos

## Future Enhancements

- [ ] Real-time NASA data integration
- [ ] Advanced filtering options
- [ ] Export functionality
- [ ] Collaboration features
- [ ] Mobile app version
- [ ] AI-powered insights

## Support

For questions or issues, please create a GitHub issue or contact the development team.

---

Built with ❤️ for NASA research exploration