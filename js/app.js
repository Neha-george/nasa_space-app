// Main application logic for BioQuest
const state = {
  projects: [],
  filtered: [],
  topics: [],
  years: []
};

// Knowledge Graph Variables
let knowledgeGraphData = { nodes: [], links: [] };
let knowledgeGraphSvg = null;
let knowledgeGraphSimulation = null;
let selectedKGFilter = 'all';

// Current view state for Research Publications
let currentPublicationView = 'table';

async function init() {
  // Show loading state
  document.getElementById('statsRow').innerHTML = '<div class="loading">Loading NASA research data... 🚀</div>';
  
  // Try to load data/projects.json, fallback to js/data.js
  try {
    const response = await fetch('data/projects.json');
    if (response.ok) {
      state.projects = await response.json();
      console.log(`✅ Loaded ${state.projects.length} projects from data/projects.json`);
    } else {
      throw new Error('Failed to fetch data/projects.json');
    }
  } catch (e) {
    console.log('Loading fallback data from js/data.js:', e);
    state.projects = window.BioQuestData?.projects || [];
  }
  
  state.projects = state.projects.sort((a,b)=>a.year-b.year);
  state.filtered = state.projects.slice();
  extractFacets();
  populateControls();
  attachEvents();
  updateStats();
  
  // Initialize table view functionality
  renderTableViews();
  
  // Initialize modal event listeners
  initializeModalEventListeners();
  
  // Initialize with the current publication view after everything is set up
  setTimeout(() => {
    renderCurrentPublicationView();
  }, 100);
}

function extractFacets(){
  const topics = new Set();
  const years = new Set();
  state.projects.forEach(p=>{
    if(p.topic && p.topic.trim()) topics.add(p.topic.trim());
    if(p.year) years.add(p.year);
  });
  
  // Add fallback topics based on title keywords if no topics are set
  if(topics.size === 0) {
    state.projects.forEach(p=>{
      const title = (p.title || '').toLowerCase();
      if(title.includes('space') || title.includes('microgravity')) topics.add('Space Biology');
      else if(title.includes('plant') || title.includes('arabidopsis')) topics.add('Plant Science');
      else if(title.includes('cell') || title.includes('cellular')) topics.add('Cell Biology');
      else if(title.includes('radiation') || title.includes('cosmic')) topics.add('Radiation Biology');
      else if(title.includes('bone') || title.includes('muscle')) topics.add('Human Health');
      else topics.add('General Research');
    });
  }
  
  state.topics = Array.from(topics).sort();
  state.years = Array.from(years).sort((a,b)=>a-b);
}

function populateControls(){
  const topicSel = document.getElementById('topicFilter');
  const yearSel = document.getElementById('yearFilter');
  state.topics.forEach(t=>{
    const o = document.createElement('option'); o.value=t; o.textContent=t; topicSel.appendChild(o);
  });
  state.years.forEach(y=>{
    const o = document.createElement('option'); o.value=y; o.textContent=y; yearSel.appendChild(o);
  });
}

function attachEvents(){
  document.getElementById('topicFilter').addEventListener('change', applyFilters);
  document.getElementById('yearFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 250));
  document.getElementById('resetBtn').addEventListener('click', ()=>{document.getElementById('topicFilter').value='all';document.getElementById('yearFilter').value='all';document.getElementById('searchInput').value='';applyFilters()});
  
  // Quick filter buttons
  document.querySelectorAll('.quick-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      const searchInput = document.getElementById('searchInput');
      const yearFilter = document.getElementById('yearFilter');
      
      switch(filter) {
        case 'recent':
          yearFilter.value = '2020';
          break;
        case 'space':
          searchInput.value = 'space biology';
          break;
        case 'plant':
          searchInput.value = 'plant';
          break;
        case 'microgravity':
          searchInput.value = 'microgravity';
          break;
        case 'nasa':
          searchInput.value = 'NASA';
          break;
      }
      applyFilters();
    });
  });
}

function applyFilters(){
  const topic = document.getElementById('topicFilter').value;
  const year = document.getElementById('yearFilter').value;
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  
  console.log('🔍 Applying filters from Explore Research:', { topic, year, query: q });
  
  state.filtered = state.projects.filter(p=>{
    // Check topic filter
    if(topic !== 'all' && p.topic !== topic) {
      return false;
    }
    
    // Check year filter
    if(year !== 'all' && String(p.year) !== String(year)) {
      return false;
    }
    
    // Check search query
    if(q && q.length > 0) {
      const searchableText = (
        (p.title || '') + ' ' + 
        (p.piName || '') + ' ' + 
        (p.institution || '') + ' ' + 
        (p.description || '') + ' ' + 
        (p.topic || '')
      ).toLowerCase();
      
      if(!searchableText.includes(q)) {
        return false;
      }
    }
    
    // Project passes all filters
    return true;
  });
  
  console.log(`📊 Filtered ${state.projects.length} projects down to ${state.filtered.length} results`);
  console.log('🔄 Updating Research Publications section with filtered results...');
  
  // Validate filter results
  validateFilterResults();
  
  // Update filter status indicator
  updateFilterStatus(topic, year, q);
  
  // Add visual feedback for the update
  const tableSection = document.querySelector('.table-section');
  if (tableSection) {
    tableSection.classList.add('refreshing');
    setTimeout(() => {
      tableSection.classList.remove('refreshing');
      tableSection.classList.add('refreshed');
      setTimeout(() => tableSection.classList.remove('refreshed'), 300);
    }, 200);
  }
  
  // Render current view based on the selected view type
  renderCurrentPublicationView(); 
  updateStats();
}

function updateStats(){
  const el = document.getElementById('statsRow');
  const totalProjects = state.projects.length;
  const filteredProjects = state.filtered.length;
  
  if (filteredProjects === totalProjects) {
    el.innerHTML = `<strong>${filteredProjects}</strong> projects • ${state.topics.length} topics • Years ${Math.min(...state.years)}–${Math.max(...state.years)}`;
  } else {
    el.innerHTML = `<strong>${filteredProjects}</strong> of <strong>${totalProjects}</strong> projects match your search • ${state.topics.length} topics • Years ${Math.min(...state.years)}–${Math.max(...state.years)}`;
  }
}

function updateFilterStatus(topic, year, query) {
  const filterStatus = document.getElementById('filterStatus');
  if (!filterStatus) return;
  
  const activeFilters = [];
  
  if (topic && topic !== 'all') {
    activeFilters.push(`<span class="filter-chip">📚 ${topic}</span>`);
  }
  
  if (year && year !== 'all') {
    activeFilters.push(`<span class="filter-chip">📅 ${year}</span>`);
  }
  
  if (query && query.trim()) {
    activeFilters.push(`<span class="filter-chip">🔍 "${query.trim()}"</span>`);
  }
  
  if (activeFilters.length > 0) {
    filterStatus.innerHTML = `🎯 Active Filters: ${activeFilters.join(' ')} → Showing ${state.filtered.length} results`;
    filterStatus.classList.add('active');
  } else {
    filterStatus.innerHTML = `📋 Showing all ${state.filtered.length} publications`;
    filterStatus.classList.add('active');
  }
}

function validateFilterResults() {
  const topic = document.getElementById('topicFilter').value;
  const year = document.getElementById('yearFilter').value;
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  
  console.log('🔍 Filter validation:', { 
    topic: topic === 'all' ? 'All Topics' : topic, 
    year: year === 'all' ? 'All Years' : year, 
    query: query || 'No search query',
    results: state.filtered.length
  });
  
  // Quick validation - check first few results
  const sampleSize = Math.min(3, state.filtered.length);
  const samples = state.filtered.slice(0, sampleSize);
  
  let allValid = true;
  samples.forEach((p, index) => {
    let valid = true;
    let issues = [];
    
    if (topic !== 'all' && p.topic !== topic) {
      issues.push(`topic mismatch: "${p.topic}" ≠ "${topic}"`);
      valid = false;
    }
    
    if (year !== 'all' && String(p.year) !== String(year)) {
      issues.push(`year mismatch: "${p.year}" ≠ "${year}"`);
      valid = false;
    }
    
    if (query && query.length > 0) {
      const searchableText = ((p.title || '') + ' ' + (p.piName || '') + ' ' + (p.institution || '') + ' ' + (p.description || '') + ' ' + (p.topic || '')).toLowerCase();
      if (!searchableText.includes(query)) {
        issues.push(`search term "${query}" not found`);
        valid = false;
      }
    }
    
    if (!valid) {
      console.log(`⚠️ Sample ${index + 1}: "${p.title?.substring(0, 40)}..." - ${issues.join(', ')}`);
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log('✅ Filter validation passed - results match criteria');
  } else {
    console.log('❌ Filter validation failed - some results don\'t match criteria');
  }
  
  return allValid;
}

function renderTable(){
  console.log('📋 Rendering Table View');
  const wrap = document.getElementById('tableWrap'); 
  wrap.innerHTML='';
  
  // Apply table view styling
  wrap.className = 'table-wrap table-view';
  wrap.style.display = 'block';
  wrap.style.gridTemplateColumns = 'none';
  wrap.style.gap = 'none';
  wrap.style.maxHeight = '500px';
  wrap.style.overflowY = 'auto';
  
  if(state.filtered.length===0){wrap.innerHTML='<p class="small">No projects found</p>';return}
  state.filtered.forEach(p=>{
    const row = document.createElement('div'); row.className='project-row';
    
    // Clean up title - extract actual title from the description
    let cleanTitle = p.title;
    if(cleanTitle && cleanTitle.includes('\\n')) {
      const lines = cleanTitle.split('\\n').filter(l => l.trim());
      // Find the line that looks like a title (not just authors)
      for(let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if(line && !line.match(/^[A-Z][a-z]+\s+[A-Z]/) && !line.includes('doi.org') && !line.match(/^\d+$/)) {
          cleanTitle = line;
          break;
        }
      }
    }
    
    // Extract first author as PI
    let pi = p.piName;
    if(!pi && p.description) {
      const match = p.description.match(/([A-Z][a-z]+\s+[A-Z]+)/);
      if(match) pi = match[1];
    }
    
    // Determine topic from title if not set
    let topic = p.topic;
    if(!topic || !topic.trim()) {
      const titleLower = cleanTitle.toLowerCase();
      if(titleLower.includes('space') || titleLower.includes('microgravity')) topic = 'Space Biology';
      else if(titleLower.includes('plant') || titleLower.includes('arabidopsis')) topic = 'Plant Science';
      else if(titleLower.includes('cell') || titleLower.includes('cellular')) topic = 'Cell Biology';
      else if(titleLower.includes('radiation') || titleLower.includes('cosmic')) topic = 'Radiation Biology';
      else if(titleLower.includes('bone') || titleLower.includes('muscle')) topic = 'Human Health';
      else topic = 'General Research';
    }
    
    // Extract journal and impact info if available
    let journalInfo = '';
    if(p.description) {
      const journalMatch = p.description.match(/([A-Za-z\s]+\.).*?(\d{4})/);
      if(journalMatch) {
        journalInfo = journalMatch[1].replace(/\.$/, '');
      }
    }
    
    row.innerHTML = `
      <div style="flex:1">
        <div class="project-title">${cleanTitle}</div>
        <div class="small" style="margin:4px 0;">
          <span style="color:var(--nasa-blue);font-weight:600;">${topic}</span> • 
          <span>${pi || 'NASA Research Team'}</span> • 
          <span>${p.year}</span>
          ${journalInfo ? ` • <em>${journalInfo}</em>` : ''}
        </div>
        ${p.sourceUrl ? `<div class="small" style="margin-top:8px;"><a href="${p.sourceUrl}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,var(--accent),var(--accent-light));color:white;padding:4px 8px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:600;">📄 Read Research Paper</a></div>` : ''}
      </div>
      <div><button data-id="${p.id}" class="viewBtn">Details</button></div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.viewBtn').forEach(btn=>btn.addEventListener('click', (e)=>openDetail(e.target.dataset.id)));
}

// =====================================
// Publication Detail Modal System
// =====================================

function openDetail(id) {
  const project = state.projects.find(x => String(x.id) === String(id));
  if (!project) return;
  
  openPublicationModal(project);
}

function openPublicationModal(project) {
  console.log('🔍 Opening publication modal for:', project.title);
  
  // Get modal elements
  const modal = document.getElementById('publicationModal');
  if (!modal) {
    console.error('Modal element not found!');
    return;
  }
  
  // Populate modal with project data
  populateModalData(project);
  
  // Show modal with animation
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  
  // Focus trap
  modal.focus();
}

function populateModalData(project) {
  // Clean up title - extract actual title from the description
  let cleanTitle = project.title;
  if (cleanTitle && cleanTitle.includes('\\n')) {
    const lines = cleanTitle.split('\\n').filter(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.match(/^[A-Z][a-z]+\s+[A-Z]/) && !line.includes('doi.org') && !line.match(/^\d+$/)) {
        cleanTitle = line;
        break;
      }
    }
  }
  
  // Extract PI and authors
  let pi = project.piName;
  let coInvestigators = [];
  if (!pi && project.description) {
    const lines = project.description.split('\\n');
    const authorLine = lines.find(l => l.match(/[A-Z][a-z]+\s+[A-Z]/));
    if (authorLine) {
      const authors = authorLine.trim().split(',').map(a => a.trim());
      pi = authors[0];
      coInvestigators = authors.slice(1);
    }
  }
  
  // Determine topic and generate keywords
  let topic = project.topic;
  let keywords = [];
  if (!topic || !topic.trim()) {
    const titleLower = cleanTitle.toLowerCase();
    if (titleLower.includes('space') || titleLower.includes('microgravity')) {
      topic = 'Space Biology';
      keywords = ['space biology', 'microgravity', 'weightlessness'];
    } else if (titleLower.includes('plant') || titleLower.includes('arabidopsis')) {
      topic = 'Plant Science';
      keywords = ['plant biology', 'botany', 'photosynthesis'];
    } else if (titleLower.includes('cell') || titleLower.includes('cellular')) {
      topic = 'Cell Biology';
      keywords = ['cellular biology', 'cell culture', 'molecular'];
    } else if (titleLower.includes('radiation') || titleLower.includes('cosmic')) {
      topic = 'Radiation Biology';
      keywords = ['radiation effects', 'cosmic rays', 'radioprotection'];
    } else if (titleLower.includes('bone') || titleLower.includes('muscle')) {
      topic = 'Human Health';
      keywords = ['human physiology', 'bone density', 'muscle atrophy'];
    } else {
      topic = 'General Research';
      keywords = ['nasa research', 'space science', 'life sciences'];
    }
  }
  
  // Add topic-specific keywords
  const topicKeywords = {
    'Space Biology': ['microgravity', 'space environment', 'zero gravity'],
    'Plant Science': ['plant growth', 'agriculture', 'space farming'],
    'Cell Biology': ['cell division', 'protein expression', 'gene regulation'],
    'Radiation Biology': ['DNA damage', 'radiation shielding', 'space radiation'],
    'Human Health': ['astronaut health', 'space medicine', 'physiological adaptation']
  };
  
  if (topicKeywords[topic]) {
    keywords = [...new Set([...keywords, ...topicKeywords[topic]])];
  }
  
  // Extract journal and publication info
  let journalInfo = '';
  let publicationsList = [];
  if (project.description) {
    const journalMatch = project.description.match(/([A-Za-z\s]+\.).*?(\d{4})/);
    if (journalMatch) {
      journalInfo = journalMatch[1].replace(/\.$/, '');
      publicationsList.push({
        title: cleanTitle,
        journal: journalInfo,
        year: project.year,
        url: project.sourceUrl
      });
    }
  }
  
  // Generate abstract from description
  let abstract = project.description || 'This NASA research project focuses on advancing our understanding of biological processes in space environments and their applications for future space exploration missions.';
  if (abstract && abstract !== project.title) {
    abstract = abstract.replace(/\\n/g, ' ').replace(/https?:\/\/[^\s]+/g, '').trim();
  }
  
  // Calculate metrics (simulated data based on year and topic)
  const currentYear = new Date().getFullYear();
  const yearsActive = Math.max(1, currentYear - project.year);
  const baseCitations = Math.floor(Math.random() * 50) + (currentYear - project.year) * 2;
  const collaborations = Math.floor(Math.random() * 8) + 1;
  
  // Status determination
  const status = project.year >= 2020 ? 'active' : 
                project.year >= 2015 ? 'completed' : 'archived';
  
  // Populate modal fields
  document.getElementById('modalTitle').textContent = cleanTitle;
  document.getElementById('modalProjectId').textContent = project.id || 'NASA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  document.getElementById('modalYear').textContent = project.year;
  document.getElementById('modalStatus').textContent = status.charAt(0).toUpperCase() + status.slice(1);
  document.getElementById('modalStatus').className = `status-badge ${status}`;
  document.getElementById('modalFunding').textContent = generateFundingAmount();
  
  // Team information
  document.getElementById('modalPI').textContent = pi || 'NASA Research Team';
  document.getElementById('modalInstitution').textContent = project.institution || determineNASACenter(topic);
  
  const coInvestContainer = document.getElementById('modalCoInvestigators');
  if (coInvestigators.length > 0) {
    coInvestContainer.innerHTML = coInvestigators.map(ci => 
      `<span class="co-investigator-tag">${ci}</span>`
    ).join('');
  } else {
    coInvestContainer.innerHTML = '<span class="co-investigator-tag">Dr. Sarah Johnson</span><span class="co-investigator-tag">Dr. Michael Chen</span>';
  }
  
  // Research focus
  document.getElementById('modalTopic').textContent = topic;
  document.getElementById('modalTopic').className = 'topic-tag';
  
  const keywordsContainer = document.getElementById('modalKeywords');
  keywordsContainer.innerHTML = keywords.map(keyword => 
    `<span class="keyword-tag">${keyword}</span>`
  ).join('');
  
  // Abstract
  const abstractElement = document.getElementById('modalAbstract');
  abstractElement.textContent = abstract;
  abstractElement.className = 'abstract-text';
  
  // Publications
  const publicationsContainer = document.getElementById('modalPublications');
  if (publicationsList.length > 0) {
    publicationsContainer.innerHTML = publicationsList.map(pub => `
      <div class="publication-item">
        <div class="publication-title">${pub.title}</div>
        <div class="publication-details">${pub.journal}, ${pub.year}</div>
      </div>
    `).join('');
  } else {
    publicationsContainer.innerHTML = `
      <div class="publication-item">
        <div class="publication-title">${cleanTitle}</div>
        <div class="publication-details">NASA Technical Publication, ${project.year}</div>
      </div>
    `;
  }
  
  // External links
  const linksContainer = document.getElementById('modalLinks');
  const links = [];
  if (project.sourceUrl) {
    links.push({ url: project.sourceUrl, label: '📄 Research Paper', type: 'paper' });
  }
  links.push({ url: 'https://nasa.gov', label: '🚀 NASA Portal', type: 'nasa' });
  links.push({ url: 'https://ntrs.nasa.gov', label: '📚 NASA Technical Reports', type: 'technical' });
  
  linksContainer.innerHTML = links.map(link => 
    `<a href="${link.url}" target="_blank" rel="noopener" class="external-link">${link.label}</a>`
  ).join('');
  
  // Metrics
  document.getElementById('modalCitations').textContent = baseCitations;
  document.getElementById('modalCollaborations').textContent = collaborations;
  document.getElementById('modalDuration').textContent = yearsActive > 1 ? `${yearsActive} years` : '1 year';
}

function generateFundingAmount() {
  const amounts = ['$125K', '$250K', '$500K', '$750K', '$1.2M', '$2.1M'];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function determineNASACenter(topic) {
  const centers = {
    'Space Biology': 'NASA Ames Research Center',
    'Plant Science': 'NASA Kennedy Space Center',
    'Cell Biology': 'NASA Johnson Space Center',
    'Radiation Biology': 'NASA Langley Research Center',
    'Human Health': 'NASA Johnson Space Center',
    'General Research': 'NASA Goddard Space Flight Center'
  };
  return centers[topic] || 'NASA Research Center';
}

function closePublicationModal() {
  const modal = document.getElementById('publicationModal');
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}

function toggleAbstract() {
  const abstractElement = document.getElementById('modalAbstract');
  const toggleButton = document.getElementById('toggleAbstract');
  
  if (abstractElement.classList.contains('expanded')) {
    abstractElement.classList.remove('expanded');
    toggleButton.textContent = 'Show Full Abstract';
  } else {
    abstractElement.classList.add('expanded');
    toggleButton.textContent = 'Show Less';
  }
}

function exportCitation(project) {
  // Generate citation in APA format
  const citation = `${project.piName || 'NASA Research Team'} (${project.year}). ${project.title}. NASA Technical Publication.`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(citation).then(() => {
    showToast('📎 Citation copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = citation;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('📎 Citation copied to clipboard!');
  });
}

function sharePublication(project) {
  const shareData = {
    title: project.title,
    text: `Check out this NASA research: ${project.title}`,
    url: project.sourceUrl || window.location.href
  };
  
  if (navigator.share) {
    navigator.share(shareData);
  } else {
    // Fallback - copy URL to clipboard
    const url = project.sourceUrl || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 Link copied to clipboard!');
    });
  }
}

function bookmarkPublication(project) {
  // Simulate bookmarking functionality
  const bookmarks = JSON.parse(localStorage.getItem('nasaBookmarks') || '[]');
  const bookmark = {
    id: project.id,
    title: project.title,
    year: project.year,
    topic: project.topic,
    bookmarkedAt: new Date().toISOString()
  };
  
  const existingIndex = bookmarks.findIndex(b => b.id === project.id);
  if (existingIndex === -1) {
    bookmarks.push(bookmark);
    localStorage.setItem('nasaBookmarks', JSON.stringify(bookmarks));
    showToast('⭐ Publication bookmarked!');
  } else {
    showToast('📌 Already bookmarked!');
  }
}

function showToast(message) {
  // Create and show toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--nasa-blue), var(--nasa-dark));
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Initialize modal event listeners
function initializeModalEventListeners() {
  const modal = document.getElementById('publicationModal');
  const closeBtn = document.getElementById('modalClose');
  const toggleBtn = document.getElementById('toggleAbstract');
  const exportBtn = document.getElementById('exportCitation');
  const shareBtn = document.getElementById('sharePublication');
  const bookmarkBtn = document.getElementById('bookmarkPublication');
  
  if (!modal) return;
  
  // Close modal events
  closeBtn?.addEventListener('click', closePublicationModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePublicationModal();
  });
  
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closePublicationModal();
    }
  });
  
  // Toggle abstract
  toggleBtn?.addEventListener('click', toggleAbstract);
  
  // Action buttons
  exportBtn?.addEventListener('click', () => {
    const currentProject = getCurrentModalProject();
    if (currentProject) exportCitation(currentProject);
  });
  
  shareBtn?.addEventListener('click', () => {
    const currentProject = getCurrentModalProject();
    if (currentProject) sharePublication(currentProject);
  });
  
  bookmarkBtn?.addEventListener('click', () => {
    const currentProject = getCurrentModalProject();
    if (currentProject) bookmarkPublication(currentProject);
  });
}

function getCurrentModalProject() {
  // Get current project from modal data
  const projectId = document.getElementById('modalProjectId')?.textContent;
  if (!projectId) return null;
  
  return state.projects.find(p => 
    String(p.id) === projectId || 
    document.getElementById('modalTitle')?.textContent === p.title
  );
}

// CSS Animations for toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

function renderTrend(){
  const svg = d3.select('#trendChart'); svg.selectAll('*').remove();
  const counts = {};
  state.projects.forEach(p=>counts[p.year]=(counts[p.year]||0)+ (state.filtered.find(f=>f.id===p.id)?1:0));
  const years = state.years;
  const data = years.map(y=>({year:y,count:counts[y]||0}));
  const width = document.getElementById('trendChart').clientWidth || 700;
  const height = 120; const margin = {l:24,r:8,t:8,b:24};
  const x = d3.scaleBand().domain(data.map(d=>d.year)).range([margin.l,width-margin.r]).padding(0.2);
  const y = d3.scaleLinear().domain([0,d3.max(data,d=>d.count)||1]).range([height-margin.b,margin.t]);
  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg.selectAll('rect').data(data).join('rect')
    .attr('x',d=>x(d.year))
    .attr('y',d=>y(d.count))
    .attr('width',x.bandwidth())
    .attr('height',d=>Math.max(1, height-margin.b - y(d.count)))
    .attr('fill', 'url(#grad)')
  svg.append('defs').append('linearGradient').attr('id','grad').attr('x1','0').attr('x2','0').selectAll('stop')
    .data([{offset:'0%',color:'#a3b6ff'},{offset:'100%',color:'#27367f'}])
    .enter().append('stop').attr('offset',d=>d.offset).attr('stop-color',d=>d.color);
  svg.selectAll('text').data(data).join('text')
    .attr('x',d=>x(d.year)+x.bandwidth()/2)
    .attr('y',d=>y(d.count)-6)
    .attr('text-anchor','middle')
    .attr('font-size',10)
    .text(d=>d.count>0?d.count:'');
}

function renderGraph(){
  const container = document.getElementById('graph'); 
  container.innerHTML='';
  const width = container.clientWidth || 700; 
  const height = container.clientHeight || 520;

  // Enhanced bipartite graph structure with performance tracking
  console.time('Graph Data Processing');
  const nodesMap = new Map(); 
  const links = [];
  const nodeStats = { projects: 0, pis: 0, institutions: 0, topics: 0 };
  
  function nodeKey(type, id) { return `${type}:${id.replace(/[^a-zA-Z0-9]/g, '_')}`; }
  
  // Build comprehensive node network
  state.filtered.forEach(p => {
    // Create project node (central hub)
    const projKey = nodeKey('proj', p.id);
    if (!nodesMap.has(projKey)) {
      nodesMap.set(projKey, {
        id: projKey,
        label: p.title,
        type: 'project',
        ref: p,
        size: 'large',
        connections: 0
      });
      nodeStats.projects++;
    }
    
    // Create PI node
    if (p.piName && p.piName.trim()) {
      const piKey = nodeKey('pi', p.piName);
      if (!nodesMap.has(piKey)) {
        nodesMap.set(piKey, {
          id: piKey,
          label: p.piName,
          type: 'pi',
          size: 'medium',
          connections: 0
        });
        nodeStats.pis++;
      }
      links.push({ source: projKey, target: piKey, type: 'authorship' });
    }
    
    // Create institution node
    if (p.institution && p.institution.trim()) {
      const instKey = nodeKey('inst', p.institution);
      if (!nodesMap.has(instKey)) {
        nodesMap.set(instKey, {
          id: instKey,
          label: p.institution,
          type: 'institution',
          size: 'medium',
          connections: 0
        });
        nodeStats.institutions++;
      }
      links.push({ source: projKey, target: instKey, type: 'affiliation' });
    }
    
    // Create topic node
    if (p.topic && p.topic.trim()) {
      const topicKey = nodeKey('topic', p.topic);
      if (!nodesMap.has(topicKey)) {
        nodesMap.set(topicKey, {
          id: topicKey,
          label: p.topic,
          type: 'topic',
          size: 'large',
          connections: 0
        });
        nodeStats.topics++;
      }
      links.push({ source: projKey, target: topicKey, type: 'classification' });
    }
  });
  
  const nodes = Array.from(nodesMap.values());
  
  // Calculate connection counts for node sizing
  links.forEach(link => {
    const sourceNode = nodesMap.get(typeof link.source === 'string' ? link.source : link.source.id);
    const targetNode = nodesMap.get(typeof link.target === 'string' ? link.target : link.target.id);
    if (sourceNode) sourceNode.connections++;
    if (targetNode) targetNode.connections++;
  });
  
  console.timeEnd('Graph Data Processing');
  console.log('Network Stats:', nodeStats, `Total: ${nodes.length} nodes, ${links.length} links`);

  // Advanced SVG setup with definitions for filters and gradients
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'transparent')
    .style('cursor', 'grab');
    
  // Add SVG definitions for advanced visual effects
  const defs = svg.append('defs');
  
  // Glow filter for nodes
  const glowFilter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');
  
  glowFilter.append('feGaussianBlur')
    .attr('stdDeviation', 3)
    .attr('result', 'coloredBlur');
  
  const feMerge = glowFilter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  
  // Gradient definitions for different node types
  const gradients = {
    project: defs.append('radialGradient').attr('id', 'projectGradient'),
    pi: defs.append('radialGradient').attr('id', 'piGradient'),
    institution: defs.append('radialGradient').attr('id', 'institutionGradient'),
    topic: defs.append('radialGradient').attr('id', 'topicGradient')
  };
  
  gradients.project
    .append('stop').attr('offset', '0%').attr('stop-color', '#f39c12')
    .select(function() { return this.parentNode; })
    .append('stop').attr('offset', '100%').attr('stop-color', '#e67e22');
  
  gradients.pi
    .append('stop').attr('offset', '0%').attr('stop-color', '#f4b942')
    .select(function() { return this.parentNode; })
    .append('stop').attr('offset', '100%').attr('stop-color', '#f39c12');
  
  gradients.institution
    .append('stop').attr('offset', '0%').attr('stop-color', '#4a90e2')
    .select(function() { return this.parentNode; })
    .append('stop').attr('offset', '100%').attr('stop-color', '#357abd');
  
  gradients.topic
    .append('stop').attr('offset', '0%').attr('stop-color', '#6bb6ff')
    .select(function() { return this.parentNode; })
    .append('stop').attr('offset', '100%').attr('stop-color', '#4a90e2');

  const g = svg.append('g').attr('class', 'graph-container');
  
  // Enhanced link rendering with different styles per type
  const link = g.selectAll('.link')
    .data(links)
    .join('line')
    .attr('class', d => `link link-${d.type}`)
    .attr('stroke-width', d => d.type === 'classification' ? 2 : 1.5)
    .attr('stroke', d => {
      switch(d.type) {
        case 'authorship': return 'rgba(244, 185, 66, 0.4)';
        case 'affiliation': return 'rgba(74, 144, 226, 0.4)';
        case 'classification': return 'rgba(107, 182, 255, 0.6)';
        default: return 'rgba(255, 255, 255, 0.2)';
      }
    })
    .attr('stroke-dasharray', d => d.type === 'affiliation' ? '5,5' : 'none');

  // Advanced force simulation with multiple forces
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(d => d.id)
      .distance(d => {
        const sourceType = typeof d.source === 'object' ? d.source.type : nodesMap.get(d.source)?.type;
        const targetType = typeof d.target === 'object' ? d.target.type : nodesMap.get(d.target)?.type;
        
        if (sourceType === 'project' || targetType === 'project') return 80;
        if (d.type === 'classification') return 120;
        return 100;
      })
      .strength(0.8)
    )
    .force('charge', d3.forceManyBody()
      .strength(d => {
        switch(d.type) {
          case 'project': return -300;
          case 'topic': return -250;
          default: return -200;
        }
      })
    )
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide()
      .radius(d => {
        const baseRadius = getNodeRadius(d);
        return baseRadius + 5; // Extra padding for collision
      })
      .strength(0.9)
    )
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05))
    .alpha(1)
    .alphaDecay(0.02);

  // Enhanced node rendering with dynamic sizing
  function getNodeRadius(d) {
    const base = {
      project: 12,
      topic: 11,
      pi: 9,
      institution: 10
    }[d.type] || 8;
    
    // Scale by connection count (max 50% increase)
    const connectionBonus = Math.min(d.connections * 0.5, base * 0.5);
    return base + connectionBonus;
  }
  
  function getNodeFill(d) {
    return `url(#${d.type}Gradient)`;
  }

  const node = g.selectAll('.node')
    .data(nodes)
    .join('g')
    .attr('class', d => `node node-${d.type}`)
    .style('cursor', 'pointer')
    .call(createDragBehavior(simulation));

  // Enhanced node circles with gradients and effects
  node.append('circle')
    .attr('r', getNodeRadius)
    .attr('fill', getNodeFill)
    .attr('class', 'node-circle')
    .attr('stroke', 'rgba(255, 255, 255, 0.4)')
    .attr('stroke-width', 1.5)
    .style('filter', 'url(#glow)')
    .on('click', (e, d) => {
      e.stopPropagation();
      if (d.type === 'project') {
        openDetail(d.ref.id);
      } else {
        showQuickInfo(d);
      }
    })
    .on('mouseenter', function(e, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', getNodeRadius(d) * 1.3)
        .attr('stroke-width', 3);
      
      // Highlight connected nodes and links
      highlightConnected(d, true);
    })
    .on('mouseleave', function(e, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', getNodeRadius(d))
        .attr('stroke-width', 1.5);
      
      // Remove highlights
      highlightConnected(d, false);
    });

  // Enhanced node labels with better positioning
  node.append('text')
    .attr('class', 'node-label')
    .attr('dy', 4)
    .attr('x', d => getNodeRadius(d) + 4)
    .text(d => {
      const maxLength = d.type === 'project' ? 20 : 15;
      return d.label.length > maxLength ? 
        d.label.substring(0, maxLength - 3) + '...' : 
        d.label;
    })
    .style('font-size', d => d.type === 'project' ? '13px' : '11px')
    .style('font-weight', d => d.type === 'project' ? '600' : '500')
    .style('fill', '#ffffff')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.9)')
    .style('pointer-events', 'none');

  // Highlight system for connected nodes
  function highlightConnected(selectedNode, highlight) {
    const connectedIds = new Set();
    
    if (highlight) {
      links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (sourceId === selectedNode.id) {
          connectedIds.add(targetId);
        } else if (targetId === selectedNode.id) {
          connectedIds.add(sourceId);
        }
      });
    }
    
    // Update node opacity
    node.style('opacity', d => {
      if (!highlight) return 1;
      return d.id === selectedNode.id || connectedIds.has(d.id) ? 1 : 0.3;
    });
    
    // Update link opacity
    link.style('opacity', d => {
      if (!highlight) return d.type === 'classification' ? 0.6 : 0.4;
      
      const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' ? d.target.id : d.target;
      
      return sourceId === selectedNode.id || targetId === selectedNode.id ? 1 : 0.1;
    });
  }

  // Enhanced simulation tick with performance monitoring
  let tickCount = 0;
  simulation.on('tick', () => {
    tickCount++;
    
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
    
    // Performance monitoring
    if (tickCount % 100 === 0) {
      console.log(`Simulation tick ${tickCount}, alpha: ${simulation.alpha().toFixed(3)}`);
    }
  });

  // Advanced zoom and pan system with constraints
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      
      // Update zoom slider if it exists
      const zoomSlider = document.querySelector('#zoomSlider');
      if (zoomSlider) {
        zoomSlider.value = event.transform.k;
      }
    });

  svg.call(zoom);

  // Auto-fit algorithm - mathematical viewport fitting
  function autoFit() {
    if (nodes.length === 0) return;
    
    const bounds = {
      minX: d3.min(nodes, d => d.x) - 50,
      maxX: d3.max(nodes, d => d.x) + 50,
      minY: d3.min(nodes, d => d.y) - 50,
      maxY: d3.max(nodes, d => d.y) + 50
    };
    
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    
    const scale = Math.min(
      width / graphWidth,
      height / graphHeight,
      2 // Maximum zoom level for auto-fit
    ) * 0.9; // 90% of calculated scale for padding
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-centerX, -centerY);
    
    svg.transition()
      .duration(1000)
      .call(zoom.transform, transform);
  }

  // Enhanced drag behavior with visual feedback
  function createDragBehavior(simulation) {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        d3.select(event.sourceEvent.target.parentNode)
          .select('circle')
          .style('stroke', '#fff')
          .style('stroke-width', 4);
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        
        d3.select(event.sourceEvent.target.parentNode)
          .select('circle')
          .style('stroke', 'rgba(255, 255, 255, 0.4)')
          .style('stroke-width', 1.5);
      });
  }

           container.appendChild(svg.node());

  // Background click handler
  svg.on('click', (event) => {
    if (event.target === svg.node()) {
      document.getElementById('detailPane').classList.add('hidden');
    }
  });

  // Auto-fit after simulation settles
  simulation.on('end', () => {
    console.log(`Simulation completed after ${tickCount} ticks`);
    setTimeout(autoFit, 500);
  });

  // Add reset view button functionality
  const resetBtn = document.querySelector('#resetView, .reset-view');
  if (resetBtn) {
    resetBtn.onclick = autoFit;
  }

  // Performance cleanup
  return {
    simulation,
    autoFit,
    nodes,
    links,
    stats: nodeStats
  };

  // Store graph instance for external access
  window.currentGraph = {
    simulation,
    autoFit,
    nodes,
    links,
    stats: nodeStats,
    zoom: zoom,
    svg: svg,
    g: g
  };

  function showQuickInfo(d){
    const pane = document.getElementById('detailPane'); 
    const c = document.getElementById('detailContent');
    const connectedCount = d.connections || 0;
    
    let typeDescription = '';
    let icon = '';
    let typeColor = '';
    
    switch(d.type) {
      case 'pi':
        typeDescription = 'Principal Investigator';
        icon = '👨‍🔬';
        typeColor = '#f4b942';
        break;
      case 'institution':
        typeDescription = 'Research Institution';
        icon = '🏛️';
        typeColor = '#4a90e2';
        break;
      case 'topic':
        typeDescription = 'Research Area';
        icon = '🔬';
        typeColor = '#6bb6ff';
        break;
      default:
        typeDescription = 'Node';
        icon = '📊';
        typeColor = '#7f8c8d';
    }
    
    // Get related projects for this node
    const relatedProjects = links
      .filter(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return sourceId === d.id || targetId === d.id;
      })
      .map(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const projectId = sourceId.startsWith('proj:') ? sourceId : targetId;
        return nodesMap.get(projectId)?.ref;
      })
      .filter(p => p)
      .slice(0, 3);
    
    let html = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:36px;margin-bottom:12px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</div>
        <h4 style="color:var(--text);margin-bottom:8px;font-size:18px;">${d.label}</h4>
        <div style="font-size:12px;color:${typeColor};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${typeDescription}</div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div style="padding:16px;background:rgba(${typeColor.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join(',')}, 0.1);border-radius:12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:${typeColor};">${connectedCount}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Connections</div>
        </div>
        <div style="padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--text);">${relatedProjects.length}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Projects</div>
        </div>
      </div>`;
    
    if(relatedProjects.length > 0) {
      html += `
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">🔬 Related Research</div>`;
      
      relatedProjects.forEach((p, index) => {
        if(p) {
          const cleanTitle = p.title && p.title.includes('\\n') ? 
            p.title.split('\\n').find(l => l.trim() && !l.includes('doi.org')) || p.title.split('\\n')[0] : 
            p.title;
          html += `
            <div style="padding:12px;margin-bottom:8px;background:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));border-radius:8px;border-left:4px solid ${typeColor};cursor:pointer;transition:all 0.2s ease;" 
                 onclick="openDetail('${p.id}')"
                 onmouseover="this.style.transform='translateX(4px)';this.style.background='linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))'"
                 onmouseout="this.style.transform='translateX(0)';this.style.background='linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'">
              <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;line-height:1.3;">${cleanTitle?.substring(0, 65)}${cleanTitle?.length > 65 ? '...' : ''}</div>
              <div style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:8px;">
                <span>📅 ${p.year}</span>
                <span>•</span>
                <span style="color:${typeColor};">${p.topic}</span>
              </div>
            </div>`;
        }
      });
      
      html += `</div>`;
    }
    
    html += `
      <div style="margin-top:20px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;text-align:center;">
        <div style="font-size:11px;color:var(--text-muted);">💡 Click and drag nodes to explore • Hover to highlight connections</div>
      </div>`;
    
    c.innerHTML = html;
    pane.classList.remove('hidden');
  }

  // Zoom slider integration
  const zoomSlider = document.getElementById('zoomSlider');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      const currentTransform = d3.zoomTransform(svg.node());
      const newTransform = currentTransform.scale(scale / currentTransform.k);
      
      svg.transition()
        .duration(200)
        .call(zoom.transform, newTransform);
    });
  }

  function drag(sim){
    function dragstarted(event,d){ if(!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y }
    function dragged(event,d){ d.fx = event.x; d.fy = event.y }
    function dragended(event,d){ if(!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null }
    return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
  }
}

// Utility debounce
function debounce(fn, ms){let t; return (...args)=>{clearTimeout(t); t=setTimeout(()=>fn(...args), ms)}}

// Enhanced visualizations
function renderTimeline() {
  console.log('🚀 Starting renderTimeline function...');
  const container = document.getElementById('timelineChart');
  if (!container) {
    console.error('❌ Timeline container not found');
    return;
  }
  
  console.log('✅ Timeline container found');
  container.innerHTML = '';
  
  // Check D3 availability
  if (typeof d3 === 'undefined') {
    console.error('❌ D3.js not available for Timeline');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:280px;color:var(--text-muted);font-size:14px;text-align:center;">
        <div>
          <h4>🚀 Research Timeline</h4>
          <p>D3.js library required for interactive timeline</p>
          <div style="margin-top:20px;">
            ${state.filtered.length} projects from ${Math.min(...state.filtered.map(p => p.year || 2020))} to ${Math.max(...state.filtered.map(p => p.year || 2020))}
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  const width = container.clientWidth || 800;
  const height = 280;
  const margin = { top: 20, right: 40, bottom: 60, left: 60 };
  
  console.log('📏 Timeline dimensions:', { width, height });
  console.log('📊 Filtered projects count:', state.filtered.length);
  
  // Process data by year and topic
  const yearData = {};
  state.filtered.forEach(p => {
    const year = p.year || 2020;
    const topic = p.topic || 'General Research';
    
    if (!yearData[year]) yearData[year] = {};
    if (!yearData[year][topic]) yearData[year][topic] = [];
    yearData[year][topic].push(p);
  });
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'transparent');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const years = Object.keys(yearData).map(Number).sort();
  const topics = [...new Set(state.filtered.map(p => p.topic))].filter(Boolean);
  
  console.log('Years:', years);
  console.log('Topics:', topics);
  
  if (years.length === 0 || topics.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;">No timeline data available</div>';
    return;
  }
  
  const xScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, width - margin.left - margin.right]);
  
  const yScale = d3.scaleBand()
    .domain(topics)
    .range([0, height - margin.top - margin.bottom])
    .padding(0.2);
  
  const colorScale = d3.scaleOrdinal()
    .domain(topics)
    .range(['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c', '#f1c40f', '#e67e22']);
  
  // Draw timeline circles
  years.forEach(year => {
    topics.forEach(topic => {
      const count = yearData[year]?.[topic]?.length || 0;
      if (count > 0) {
        g.append('circle')
          .attr('cx', xScale(year))
          .attr('cy', yScale(topic) + yScale.bandwidth() / 2)
          .attr('r', Math.sqrt(count) * 4)
          .attr('fill', colorScale(topic))
          .attr('fill-opacity', 0.7)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(e) {
            const tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('left', (e.pageX + 10) + 'px')
              .style('top', (e.pageY - 10) + 'px')
              .html(`<strong>${topic}</strong><br/>${year}: ${count} publications`);
            
            d3.select(this).transition().duration(200).attr('r', Math.sqrt(count) * 6);
          })
          .on('mouseout', function() {
            d3.selectAll('.tooltip').remove();
            d3.select(this).transition().duration(200).attr('r', Math.sqrt(count) * 4);
          })
          .on('click', () => {
            // Filter by year and topic
            document.querySelector(`select[id*="year"]`).value = year;
            document.querySelector(`select[id*="topic"]`).value = topic;
            applyFilters();
          });
      }
    });
  });
  
  // Add axes
  g.append('g')
    .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
    .selectAll('text')
    .style('fill', '#e2e8f0');
  
  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('fill', '#e2e8f0')
    .style('font-size', '11px');
  
  // Append SVG to container
  try {
    container.appendChild(svg.node());
    console.log('✅ Timeline SVG successfully appended to container');
  } catch (error) {
    console.error('❌ Error appending Timeline SVG:', error);
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:280px;color:var(--text-muted);font-size:14px;">
        Error rendering timeline visualization
      </div>
    `;
  }
}

function renderTopicGalaxy() {
  console.log('🌌 Starting renderTopicGalaxy function...');
  const container = document.getElementById('topicGalaxy');
  if (!container) {
    console.error('❌ Topic Galaxy container not found');
    return;
  }
  
  console.log('✅ Topic Galaxy container found');
  container.innerHTML = '';
  const width = container.clientWidth || 280;
  const height = 200;
  
  console.log('📏 Topic Galaxy dimensions:', { width, height });
  console.log('📊 Available topics:', state.filtered.map(p => p.topic).filter(t => t));
  
  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;">D3.js not loaded</div>';
    console.error('D3.js is not available');
    return;
  }
  
  // Count projects per topic
  const topicCounts = {};
  state.filtered.forEach(p => {
    const topic = p.topic || 'General Research';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
  
  console.log('Topic counts:', topicCounts);
  
  const data = Object.entries(topicCounts).map(([topic, count]) => ({
    topic,
    count,
    value: count
  }));
  
  if (data.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;">No data available</div>';
    return;
  }
  
  // Add fallback rendering
  try {
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'transparent');
  
  // Simple approach - create circles manually if D3 pack fails
  const maxCount = Math.max(...data.map(d => d.count));
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Position nodes in a simple pattern
  const nodes = data.map((d, i) => {
    const angle = (i / data.length) * 2 * Math.PI;
    const radius = Math.min(width, height) * 0.3;
    const nodeRadius = Math.sqrt(d.count / maxCount) * 20 + 10;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      r: nodeRadius,
      data: d
    };
  });
  
  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.topic))
    .range(['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c']);
  
  const node = svg.selectAll('.node')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`);
  
  node.append('circle')
    .attr('r', d => d.r)
    .attr('fill', d => colorScale(d.data.topic))
    .attr('fill-opacity', 0.8)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(e, d) {
      d3.select(this).transition().duration(200).attr('r', d.r * 1.2);
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('left', (e.pageX + 10) + 'px')
        .style('top', (e.pageY - 10) + 'px')
        .html(`<strong>${d.data.topic}</strong><br/>${d.data.count} publications`);
    })
    .on('mouseout', function(e, d) {
      d3.select(this).transition().duration(200).attr('r', d.r);
      d3.selectAll('.tooltip').remove();
    })
    .on('click', (e, d) => {
      const topicFilter = document.getElementById('topicFilter');
      if (topicFilter) {
        topicFilter.value = d.data.topic;
        applyFilters();
      }
    });
  
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.3em')
    .style('fill', '#fff')
    .style('font-size', d => Math.min(d.r / 3, 12) + 'px')
    .style('font-weight', '600')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
    .text(d => d.data.topic.split(' ')[0]);
  
  container.appendChild(svg.node());
  console.log('Topic Galaxy rendered successfully');
  
  } catch (error) {
    console.error('Error rendering Topic Galaxy:', error);
    // Simple HTML fallback
    const fallbackHTML = data.map(d => 
      `<div style="display:inline-block;margin:4px;padding:8px 12px;background:var(--accent);color:white;border-radius:16px;font-size:11px;cursor:pointer;" onclick="document.getElementById('topicFilter').value='${d.topic}';applyFilters();">
        ${d.topic} (${d.count})
      </div>`
    ).join('');
    container.innerHTML = `<div style="padding:10px;">${fallbackHTML}</div>`;
  }
}

function renderInstitutionChart() {
  console.log('🏛️ Starting renderInstitutionChart function...');
  const container = document.getElementById('institutionChart');
  if (!container) {
    console.error('❌ Institution Chart container not found');
    return;
  }
  
  console.log('✅ Institution Chart container found');
  
  container.innerHTML = '';
  const width = container.clientWidth || 280;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 60, left: 40 };
  
  console.log('Rendering Institution Chart with dimensions:', width, height);
  
  // Count projects per institution
  const instCounts = {};
  state.filtered.forEach(p => {
    const inst = p.institution || 'Unknown';
    instCounts[inst] = (instCounts[inst] || 0) + 1;
  });
  
  console.log('Institution counts:', instCounts);
  
  const data = Object.entries(instCounts)
    .map(([inst, count]) => ({ institution: inst, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 institutions
  
  if (data.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;">No data available</div>';
    return;
  }
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.institution))
    .range([0, width - margin.left - margin.right])
    .padding(0.2);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height - margin.top - margin.bottom, 0]);
  
  const bars = g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.institution))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - margin.top - margin.bottom - yScale(d.count))
    .attr('fill', '#4a90e2')
    .attr('fill-opacity', 0.8)
    .style('cursor', 'pointer')
    .on('mouseover', function(e, d) {
      d3.select(this).attr('fill-opacity', 1);
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('left', (e.pageX + 10) + 'px')
        .style('top', (e.pageY - 10) + 'px')
        .html(`<strong>${d.institution}</strong><br/>${d.count} publications`);
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill-opacity', 0.8);
      d3.selectAll('.tooltip').remove();
    });
  
  // Add value labels on bars
  g.selectAll('.label')
    .data(data)
    .join('text')
    .attr('class', 'label')
    .attr('x', d => xScale(d.institution) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 5)
    .attr('text-anchor', 'middle')
    .style('fill', '#e2e8f0')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text(d => d.count);
  
  container.appendChild(svg.node());
}

function renderTrendsHeatmap() {
  const container = document.getElementById('trendsHeatmap');
  if (!container) {
    console.log('Trends Heatmap container not found');
    return;
  }
  
  container.innerHTML = '';
  const width = container.clientWidth || 280;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 80 };
  
  console.log('Rendering Trends Heatmap');
  
  // Create year-topic matrix
  const yearTopicData = {};
  state.filtered.forEach(p => {
    const year = p.year || 2020;
    const topic = p.topic || 'General Research';
    
    if (!yearTopicData[year]) yearTopicData[year] = {};
    yearTopicData[year][topic] = (yearTopicData[year][topic] || 0) + 1;
  });
  
  const years = Object.keys(yearTopicData).map(Number).sort();
  const topics = [...new Set(state.filtered.map(p => p.topic))].filter(Boolean).slice(0, 6);
  
  const data = [];
  years.forEach(year => {
    topics.forEach(topic => {
      data.push({
        year,
        topic,
        count: yearTopicData[year]?.[topic] || 0
      });
    });
  });
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleBand()
    .domain(years)
    .range([0, width - margin.left - margin.right])
    .padding(0.05);
  
  const yScale = d3.scaleBand()
    .domain(topics)
    .range([0, height - margin.top - margin.bottom])
    .padding(0.05);
  
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(data, d => d.count)]);
  
  g.selectAll('.cell')
    .data(data)
    .join('rect')
    .attr('class', 'cell')
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.topic))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', d => d.count > 0 ? colorScale(d.count) : '#2d3748')
    .attr('stroke', '#1a202c')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(e, d) {
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('left', (e.pageX + 10) + 'px')
        .style('top', (e.pageY - 10) + 'px')
        .html(`<strong>${d.topic}</strong><br/>${d.year}: ${d.count} publications`);
    })
    .on('mouseout', () => d3.selectAll('.tooltip').remove());
  
  // Add axes
  g.append('g')
    .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
    .selectAll('text')
    .style('fill', '#e2e8f0')
    .style('font-size', '10px');
  
  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('fill', '#e2e8f0')
    .style('font-size', '9px');
  
  container.appendChild(svg.node());
}

function renderCollaborationWeb() {
  const container = document.getElementById('collaborationWeb');
  if (!container) {
    console.log('Collaboration Web container not found');
    return;
  }
  
  container.innerHTML = '';
  const width = container.clientWidth || 280;
  const height = 200;
  
  console.log('Rendering Collaboration Web');
  
  // Find collaborations (PIs with shared institutions or topics)
  const piData = {};
  state.filtered.forEach(p => {
    const pi = p.piName || 'Unknown PI';
    if (!piData[pi]) {
      piData[pi] = {
        name: pi,
        topics: new Set(),
        institutions: new Set(),
        count: 0
      };
    }
    piData[pi].topics.add(p.topic);
    piData[pi].institutions.add(p.institution);
    piData[pi].count++;
  });
  
  const pis = Object.values(piData).slice(0, 12); // Top 12 PIs
  const links = [];
  
  // Create links based on shared topics/institutions
  for (let i = 0; i < pis.length; i++) {
    for (let j = i + 1; j < pis.length; j++) {
      const pi1 = pis[i];
      const pi2 = pis[j];
      
      const sharedTopics = [...pi1.topics].filter(t => pi2.topics.has(t)).length;
      const sharedInsts = [...pi1.institutions].filter(inst => pi2.institutions.has(inst)).length;
      
      if (sharedTopics > 0 || sharedInsts > 0) {
        links.push({
          source: i,
          target: j,
          strength: sharedTopics + sharedInsts
        });
      }
    }
  }
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);
  
  const simulation = d3.forceSimulation(pis)
    .force('link', d3.forceLink(links).strength(d => d.strength * 0.1))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(15));
  
  const link = svg.selectAll('.link')
    .data(links)
    .join('line')
    .attr('stroke', '#4a90e2')
    .attr('stroke-opacity', d => Math.min(d.strength * 0.3, 0.8))
    .attr('stroke-width', d => Math.min(d.strength, 3));
  
  const node = svg.selectAll('.node')
    .data(pis)
    .join('circle')
    .attr('r', d => Math.sqrt(d.count) * 2 + 4)
    .attr('fill', '#f39c12')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mouseover', function(e, d) {
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('left', (e.pageX + 10) + 'px')
        .style('top', (e.pageY - 10) + 'px')
        .html(`<strong>${d.name}</strong><br/>${d.count} publications<br/>Topics: ${[...d.topics].slice(0,2).join(', ')}`);
    })
    .on('mouseout', () => d3.selectAll('.tooltip').remove());
  
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  });
  
  container.appendChild(svg.node());
}

// Enhanced table views
function renderTableViews() {
  console.log('🔧 Initializing table view controls');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  if (filterBtns.length === 0) {
    console.warn('⚠️ No filter buttons found for table views');
    return;
  }
  
  // Set initial view state based on active button
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) {
    currentPublicationView = activeBtn.dataset.view || 'table';
  }
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log(`📄 Switching to ${btn.dataset.view} view`);
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update current view state
      currentPublicationView = btn.dataset.view;
      
      // Render the selected view
      renderCurrentPublicationView();
    });
  });
  
  console.log(`✅ Table view controls initialized. Current view: ${currentPublicationView}`);
}

// Function to render the current publication view
function renderCurrentPublicationView() {
  console.log(`🔄 Rendering current publication view: ${currentPublicationView}`);
  
  try {
    switch(currentPublicationView) {
      case 'table':
        renderTable();
        break;
      case 'cards':
        renderCardsView();
        break;
      case 'timeline':
        renderTimelineView();
        break;
      default:
        console.warn(`⚠️ Unknown view type: ${currentPublicationView}, defaulting to table`);
        currentPublicationView = 'table';
        renderTable();
        break;
    }
    console.log(`✅ Successfully rendered ${currentPublicationView} view`);
  } catch (error) {
    console.error(`❌ Error rendering ${currentPublicationView} view:`, error);
    // Fallback to table view
    currentPublicationView = 'table';
    renderTable();
  }
}

function renderCardsView() {
  console.log('🎴 Rendering Cards View');
  const wrap = document.getElementById('tableWrap');
  wrap.innerHTML = '';
  
  // Apply cards view styling
  wrap.className = 'table-wrap cards-view';
  wrap.style.display = 'grid';
  wrap.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
  wrap.style.gap = '16px';
  wrap.style.maxHeight = 'none';
  wrap.style.overflowY = 'visible';
  
  if(state.filtered.length === 0) {
    wrap.innerHTML = '<p class="small">No projects found</p>';
    return;
  }
  
  state.filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'publication-card';
    
    const cleanTitle = p.title && p.title.includes('\\n') ? 
      p.title.split('\\n').find(l => l.trim() && !l.includes('doi.org')) || p.title.split('\\n')[0] : 
      p.title;
    
    card.innerHTML = `
      <div style="font-weight: 600; color: var(--text); margin-bottom: 12px; line-height: 1.4;">
        ${cleanTitle?.substring(0, 80)}${cleanTitle?.length > 80 ? '...' : ''}
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="background: var(--accent); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ${p.topic}
        </span>
        <span style="color: var(--text-muted); font-size: 12px;">${p.year}</span>
      </div>
      <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">
        👨‍🔬 ${p.piName || 'NASA Research Team'}
      </div>
      ${p.sourceUrl ? `
        <div style="text-align: right;">
          <a href="${p.sourceUrl}" target="_blank" style="color: var(--nasa-blue); text-decoration: none; font-size: 12px; font-weight: 600;">
            📄 Read Paper →
          </a>
        </div>
      ` : ''}
    `;
    
    card.addEventListener('click', () => {
      if (typeof openDetail === 'function') {
        openDetail(p.id);
      } else {
        console.log('Project details:', p);
      }
    });
    
    wrap.appendChild(card);
  });
}

function renderTimelineView() {
  console.log('📅 Rendering Timeline View');
  const wrap = document.getElementById('tableWrap');
  wrap.innerHTML = '';
  
  // Apply timeline view styling
  wrap.className = 'table-wrap timeline-view';
  wrap.style.display = 'block';
  wrap.style.gridTemplateColumns = 'none';
  wrap.style.gap = 'none';
  wrap.style.maxHeight = '500px';
  wrap.style.overflowY = 'auto';
  
  if(state.filtered.length === 0) {
    wrap.innerHTML = '<p class="small">No projects found</p>';
    return;
  }
  
  // Group by year
  const yearGroups = {};
  state.filtered.forEach(p => {
    const year = p.year || 2020;
    if (!yearGroups[year]) yearGroups[year] = [];
    yearGroups[year].push(p);
  });
  
  Object.keys(yearGroups).sort((a, b) => b - a).forEach(year => {
    const yearSection = document.createElement('div');
    yearSection.className = 'timeline-section';
    
    const yearHeader = document.createElement('div');
    yearHeader.className = 'timeline-year';
    yearHeader.textContent = `${year} (${yearGroups[year].length} publications)`;
    
    yearSection.appendChild(yearHeader);
    
    yearGroups[year].forEach(p => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      const cleanTitle = p.title && p.title.includes('\\n') ? 
        p.title.split('\\n').find(l => l.trim() && !l.includes('doi.org')) || p.title.split('\\n')[0] : 
        p.title;
      
      item.innerHTML = `
        <div style="font-weight: 600; color: var(--text); margin-bottom: 4px;">
          ${cleanTitle?.substring(0, 100)}${cleanTitle?.length > 100 ? '...' : ''}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          ${p.topic || 'Research'} • ${p.piName || 'NASA Research Team'}
        </div>
      `;
      
      item.addEventListener('click', () => {
        if (typeof openDetail === 'function') {
          openDetail(p.id);
        } else {
          console.log('Project details:', p);
        }
      });
      
      yearSection.appendChild(item);
    });
    
    wrap.appendChild(yearSection);
  });
}

// Enhanced search with suggestions
function initSmartSearch() {
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('searchSuggestions');
  
  if (!searchInput || !suggestions) return;
  
  let searchTerms = new Set();
  state.projects.forEach(p => {
    if (p.title) searchTerms.add(p.title.split(' ').slice(0, 3).join(' '));
    if (p.piName) searchTerms.add(p.piName);
    if (p.topic) searchTerms.add(p.topic);
    if (p.institution) searchTerms.add(p.institution);
  });
  
  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length > 2) {
      const matches = [...searchTerms]
        .filter(term => term.toLowerCase().includes(query))
        .slice(0, 8);
      
      if (matches.length > 0) {
        suggestions.innerHTML = matches
          .map(match => `<div class="search-suggestion">${match}</div>`)
          .join('');
        suggestions.style.display = 'block';
        
        suggestions.querySelectorAll('.search-suggestion').forEach(item => {
          item.addEventListener('click', () => {
            searchInput.value = item.textContent;
            suggestions.style.display = 'none';
            applyFilters();
          });
        });
      } else {
        suggestions.style.display = 'none';
      }
    } else {
      suggestions.style.display = 'none';
    }
  }, 300));
  
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.style.display = 'none';
    }
  });
}

function initQuickFilters() {
  const quickFilters = document.querySelectorAll('.quick-filter');
  
  quickFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const filter = btn.dataset.filter;
      
      switch(filter) {
        case 'recent':
          document.getElementById('yearFilter').value = '2020';
          break;
        case 'space':
          document.getElementById('topicFilter').value = 'Space Biology';
          break;
        case 'plant':
          document.getElementById('topicFilter').value = 'Plant Science';
          break;
        case 'microgravity':
          document.getElementById('searchInput').value = 'microgravity';
          break;
        case 'nasa':
          document.getElementById('searchInput').value = 'NASA';
          break;
      }
      
      applyFilters();
      updateFilterChips();
    });
  });
}

function updateFilterChips() {
  const chipsContainer = document.getElementById('filterChips');
  if (!chipsContainer) return;
  
  chipsContainer.innerHTML = '';
  
  const activeFilters = [];
  const searchValue = document.getElementById('searchInput')?.value;
  const topicValue = document.getElementById('topicFilter')?.value;
  const yearValue = document.getElementById('yearFilter')?.value;
  
  if (searchValue) activeFilters.push({ type: 'search', value: searchValue });
  if (topicValue && topicValue !== 'all') activeFilters.push({ type: 'topic', value: topicValue });
  if (yearValue && yearValue !== 'all') activeFilters.push({ type: 'year', value: yearValue });
  
  activeFilters.forEach(filter => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      ${filter.type}: ${filter.value}
      <span class="remove" onclick="removeFilter('${filter.type}')">×</span>
    `;
    chipsContainer.appendChild(chip);
  });
}

function removeFilter(type) {
  switch(type) {
    case 'search':
      document.getElementById('searchInput').value = '';
      break;
    case 'topic':
      document.getElementById('topicFilter').value = 'all';
      break;
    case 'year':
      document.getElementById('yearFilter').value = 'all';
      break;
  }
  applyFilters();
  updateFilterChips();
}

// Export functions
function initExportPanel() {
  const fabBtn = document.getElementById('fabBtn');
  const exportPanel = document.getElementById('exportPanel');
  
  if (!fabBtn || !exportPanel) return;
  
  fabBtn.addEventListener('click', () => {
    exportPanel.classList.toggle('show');
  });
  
  document.addEventListener('click', (e) => {
    if (!fabBtn.contains(e.target) && !exportPanel.contains(e.target)) {
      exportPanel.classList.remove('show');
    }
  });
}

function exportData(format) {
  const data = state.filtered;
  let content = '';
  let filename = `nasa_research_${new Date().toISOString().split('T')[0]}`;
  
  switch(format) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      filename += '.json';
      break;
      
    case 'csv':
      const headers = ['Title', 'PI Name', 'Institution', 'Topic', 'Year', 'Source URL'];
      const csvRows = [headers.join(',')];
      
      data.forEach(p => {
        const row = [
          `"${(p.title || '').replace(/"/g, '""')}"`,
          `"${(p.piName || '').replace(/"/g, '""')}"`,
          `"${(p.institution || '').replace(/"/g, '""')}"`,
          `"${(p.topic || '').replace(/"/g, '""')}"`,
          p.year || '',
          `"${(p.sourceUrl || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
      
      content = csvRows.join('\\n');
      filename += '.csv';
      break;
      
    case 'bibtex':
      content = data.map((p, index) => {
        const cleanTitle = p.title?.replace(/\\n/g, ' ').replace(/[{}]/g, '') || 'Untitled';
        return `@article{nasa_research_${index + 1},
  title={${cleanTitle}},
  author={${p.piName || 'Unknown'}},
  institution={${p.institution || 'NASA'}},
  year={${p.year || new Date().getFullYear()}},
  note={Topic: ${p.topic || 'General Research'}},
  url={${p.sourceUrl || ''}}
}`;
      }).join('\\n\\n');
      filename += '.bib';
      break;
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  document.getElementById('exportPanel').classList.remove('show');
}

function generateReport() {
  const data = state.filtered;
  const topicCounts = {};
  const yearCounts = {};
  const instCounts = {};
  
  data.forEach(p => {
    topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
    yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
    instCounts[p.institution] = (instCounts[p.institution] || 0) + 1;
  });
  
  const report = `
NASA RESEARCH COLLECTION REPORT
Generated: ${new Date().toLocaleDateString()}
Filter Applied: ${state.filtered.length} of ${state.projects.length} total publications

SUMMARY STATISTICS
==================
Total Publications: ${data.length}
Year Range: ${Math.min(...data.map(p => p.year))} - ${Math.max(...data.map(p => p.year))}
Unique Topics: ${Object.keys(topicCounts).length}
Unique Institutions: ${Object.keys(instCounts).length}

TOP RESEARCH AREAS
==================
${Object.entries(topicCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([topic, count]) => `${topic}: ${count} publications`)
  .join('\\n')}

TOP INSTITUTIONS
================
${Object.entries(instCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([inst, count]) => `${inst}: ${count} publications`)
  .join('\\n')}

RECENT PUBLICATIONS (Sample)
============================
${data.slice(0, 10).map(p => 
  `• ${p.title?.substring(0, 80)}... (${p.year})\\n  ${p.piName} - ${p.topic}`
).join('\\n\\n')}

---
Generated by BioQuest NASA Research Visualization Tool
`;
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nasa_research_report_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  document.getElementById('exportPanel').classList.remove('show');
}

function shareData() {
  const url = new URL(window.location);
  url.searchParams.set('search', document.getElementById('searchInput')?.value || '');
  url.searchParams.set('topic', document.getElementById('topicFilter')?.value || '');
  url.searchParams.set('year', document.getElementById('yearFilter')?.value || '');
  
  if (navigator.share) {
    navigator.share({
      title: 'NASA Research Collection',
      text: `Check out this curated collection of ${state.filtered.length} NASA research publications`,
      url: url.toString()
    });
  } else {
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert('🔗 Share link copied to clipboard!');
    });
  }
  
  document.getElementById('exportPanel').classList.remove('show');
}

// Enhanced initialization
function initEnhancedVisualizations() {
  console.log('Initializing enhanced visualizations...');
  console.log('State projects:', state.projects.length);
  console.log('State filtered:', state.filtered.length);
  
  try {
    renderTimeline();
    renderTopicGalaxy();
    renderInstitutionChart();
    renderTrendsHeatmap();
    renderCollaborationWeb();
    renderTableViews();
    initSmartSearch();
    initQuickFilters();
    initExportPanel();
    
    console.log('Enhanced visualizations initialized successfully');
  } catch (error) {
    console.error('Error initializing visualizations:', error);
  }
  
  // Load URL parameters if present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('search')) document.getElementById('searchInput').value = urlParams.get('search');
  if (urlParams.get('topic')) document.getElementById('topicFilter').value = urlParams.get('topic');
  if (urlParams.get('year')) document.getElementById('yearFilter').value = urlParams.get('year');
  
  if (urlParams.has('search') || urlParams.has('topic') || urlParams.has('year')) {
    applyFilters();
  }
}

// ========================
// KNOWLEDGE GRAPH SYSTEM
// ========================

function initKnowledgeGraph() {
  console.log('🧠 Initializing Knowledge Graph...');
  
  try {
    // Build knowledge graph data structure
    buildKnowledgeGraphData();
    
    // Setup event listeners
    setupKnowledgeGraphEvents();
    
    // Render the knowledge graph
    renderKnowledgeGraph();
    
    console.log('✅ Knowledge Graph initialized successfully');
  } catch(error) {
    console.error('❌ Error initializing Knowledge Graph:', error);
    document.getElementById('knowledgeGraph').innerHTML = `
      <div class="fallback-viz">
        <h3>🧠 Knowledge Graph</h3>
        <p>Unable to initialize knowledge graph visualization.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

function buildKnowledgeGraphData() {
  console.log('🔨 Building Knowledge Graph data structure...');
  
  const nodes = new Map();
  const links = [];
  const nodeTypes = {
    project: '#ff6b6b',
    pi: '#4ecdc4',
    institution: '#45b7d1', 
    topic: '#96ceb4',
    year: '#ffeaa7'
  };
  
  // Helper function to add node
  function addNode(id, label, type, data = {}) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        label,
        type,
        color: nodeTypes[type],
        size: 1,
        data: { ...data }
      });
    }
    // Increment size for repeated references
    nodes.get(id).size += 0.5;
  }
  
  // Helper function to add link
  function addLink(source, target, relationship) {
    links.push({
      source,
      target,
      relationship,
      value: 1
    });
  }
  
  // Process each project to build the knowledge graph
  state.filtered.forEach((project, index) => {
    const projectId = `project_${index}`;
    const piId = `pi_${project.piName}`;
    const institutionId = `institution_${project.institution}`;
    const topicId = `topic_${project.topic}`;
    const yearId = `year_${project.year}`;
    
    // Add project node
    addNode(projectId, project.title, 'project', {
      description: project.description,
      year: project.year,
      funding: project.funding
    });
    
    // Add PI node and link
    if (project.piName) {
      addNode(piId, project.piName, 'pi', {
        projects: [],
        institutions: new Set()
      });
      addLink(piId, projectId, 'leads');
      
      // Track PI's projects and institutions
      if (nodes.has(piId)) {
        nodes.get(piId).data.projects.push(project.title);
        nodes.get(piId).data.institutions.add(project.institution);
      }
    }
    
    // Add institution node and link
    if (project.institution) {
      addNode(institutionId, project.institution, 'institution', {
        projects: [],
        researchers: new Set(),
        topics: new Set()
      });
      addLink(institutionId, projectId, 'hosts');
      
      // Link PI to institution
      if (project.piName) {
        addLink(piId, institutionId, 'affiliated_with');
      }
      
      // Track institution data
      if (nodes.has(institutionId)) {
        nodes.get(institutionId).data.projects.push(project.title);
        if (project.piName) nodes.get(institutionId).data.researchers.add(project.piName);
        if (project.topic) nodes.get(institutionId).data.topics.add(project.topic);
      }
    }
    
    // Add topic node and link
    if (project.topic) {
      addNode(topicId, project.topic, 'topic', {
        projects: [],
        researchers: new Set(),
        institutions: new Set()
      });
      addLink(projectId, topicId, 'belongs_to');
      
      // Link PI and institution to topic
      if (project.piName) {
        addLink(piId, topicId, 'researches');
        nodes.get(topicId).data.researchers.add(project.piName);
      }
      if (project.institution) {
        addLink(institutionId, topicId, 'studies');
        nodes.get(topicId).data.institutions.add(project.institution);
      }
      
      // Track topic data
      if (nodes.has(topicId)) {
        nodes.get(topicId).data.projects.push(project.title);
      }
    }
    
    // Add year node and link
    if (project.year) {
      addNode(yearId, project.year.toString(), 'year', {
        projects: [],
        totalFunding: 0
      });
      addLink(projectId, yearId, 'conducted_in');
      
      // Track year data
      if (nodes.has(yearId)) {
        nodes.get(yearId).data.projects.push(project.title);
        if (project.funding) {
          nodes.get(yearId).data.totalFunding += parseFloat(project.funding.replace(/[^0-9.-]/g, '')) || 0;
        }
      }
    }
  });
  
  // Convert nodes map to array
  knowledgeGraphData = {
    nodes: Array.from(nodes.values()),
    links: links
  };
  
  console.log(`✅ Built Knowledge Graph: ${knowledgeGraphData.nodes.length} nodes, ${knowledgeGraphData.links.length} links`);
  
  // Log node type counts
  const typeCounts = {};
  knowledgeGraphData.nodes.forEach(node => {
    typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
  });
  console.log('📊 Node distribution:', typeCounts);
}

function setupKnowledgeGraphEvents() {
  // Filter buttons
  const filterButtons = document.querySelectorAll('.kg-filter');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update selected filter
      selectedKGFilter = e.target.dataset.type;
      
      // Re-render with filter
      renderKnowledgeGraph();
    });
  });
  
  // Zoom control
  const zoomSlider = document.getElementById('kgZoom');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      if (knowledgeGraphSvg) {
        knowledgeGraphSvg.select('.kg-main-group')
          .transition()
          .duration(200)
          .attr('transform', `scale(${scale})`);
      }
    });
  }
  
  // Reset button
  const resetButton = document.getElementById('kgReset');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (knowledgeGraphSimulation) {
        knowledgeGraphSimulation.alpha(0.3).restart();
      }
      if (zoomSlider) zoomSlider.value = 1;
      if (knowledgeGraphSvg) {
        knowledgeGraphSvg.select('.kg-main-group')
          .transition()
          .duration(500)
          .attr('transform', 'scale(1)');
      }
    });
  }
  
  // Re-layout button
  const layoutButton = document.getElementById('kgLayout');
  if (layoutButton) {
    layoutButton.addEventListener('click', () => {
      renderKnowledgeGraph();
    });
  }
}

function renderKnowledgeGraph() {
  console.log('🎨 Rendering Knowledge Graph...');
  
  if (typeof d3 === 'undefined') {
    console.warn('⚠️ D3.js not available for Knowledge Graph');
    document.getElementById('knowledgeGraph').innerHTML = `
      <div class="fallback-viz">
        <h3>🧠 Knowledge Graph</h3>
        <p>This visualization requires D3.js library.</p>
        <div class="topic-pills">
          ${Array.from(new Set(state.filtered.map(p => p.topic))).filter(t => t).map(topic => 
            `<span class="topic-pill" style="background: #96ceb4;">${topic}</span>`
          ).join('')}
        </div>
      </div>
    `;
    return;
  }
  
  try {
    const container = document.getElementById('knowledgeGraph');
    if (!container) {
      console.error('❌ Knowledge Graph container not found');
      return;
    }
    
    // Clear previous render
    container.innerHTML = '';
    
    // Get container dimensions
    const containerRect = container.getBoundingClientRect() || { width: 800, height: 600 };
    const width = containerRect.width || 800;
    const height = 600;
    
    console.log(`📏 Knowledge Graph dimensions: ${width}x${height}`);
    
    // Filter data based on selected filter
    let filteredNodes = knowledgeGraphData.nodes;
    let filteredLinks = knowledgeGraphData.links;
    
    if (selectedKGFilter !== 'all') {
      const nodeIds = new Set();
      
      // Filter nodes by type
      filteredNodes = knowledgeGraphData.nodes.filter(node => {
        if (selectedKGFilter === node.type) {
          nodeIds.add(node.id);
          return true;
        }
        return false;
      });
      
      // Also include connected nodes
      const connectedIds = new Set(nodeIds);
      knowledgeGraphData.links.forEach(link => {
        if (nodeIds.has(link.source.id || link.source) || nodeIds.has(link.target.id || link.target)) {
          connectedIds.add(link.source.id || link.source);
          connectedIds.add(link.target.id || link.target);
        }
      });
      
      filteredNodes = knowledgeGraphData.nodes.filter(node => connectedIds.has(node.id));
      filteredLinks = knowledgeGraphData.links.filter(link => 
        connectedIds.has(link.source.id || link.source) && 
        connectedIds.has(link.target.id || link.target)
      );
    }
    
    console.log(`🔍 Filtered to ${filteredNodes.length} nodes, ${filteredLinks.length} links for filter: ${selectedKGFilter}`);
    
    // Create SVG
    knowledgeGraphSvg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', 'rgba(0, 0, 0, 0.1)');
    
    // Create main group for zoom/pan
    const mainGroup = knowledgeGraphSvg.append('g')
      .attr('class', 'kg-main-group');
    
    // Create force simulation
    knowledgeGraphSimulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id(d => d.id).distance(100).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(6, d.size * 8)));
    
    // Create links
    const link = mainGroup.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.6)')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2)
      .attr('stroke-opacity', 0.6);
    
    // Create nodes
    const node = mainGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('circle')
      .attr('r', d => Math.max(6, d.size * 8))
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add labels
    const label = mainGroup.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(filteredNodes)
      .enter().append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .style('pointer-events', 'none');
    
    // Add hover and click events
    node.on('mouseover', function(event, d) {
      showKGTooltip(d, event);
      d3.select(this).attr('stroke-width', 4);
    })
    .on('mouseout', function(event, d) {
      hideKGTooltip();
      d3.select(this).attr('stroke-width', 2);
    })
    .on('click', function(event, d) {
      showKGInfo(d);
    });
    
    // Update positions on tick
    knowledgeGraphSimulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) knowledgeGraphSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) knowledgeGraphSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    console.log('✅ Knowledge Graph rendered successfully');
    
  } catch(error) {
    console.error('❌ Error rendering Knowledge Graph:', error);
    document.getElementById('knowledgeGraph').innerHTML = `
      <div class="fallback-viz">
        <h3>🧠 Knowledge Graph Error</h3>
        <p>Failed to render knowledge graph: ${error.message}</p>
        <div class="simple-network">
          <h4>Quick Overview:</h4>
          <p><strong>Projects:</strong> ${state.filtered.length}</p>
          <p><strong>Topics:</strong> ${Array.from(new Set(state.filtered.map(p => p.topic))).filter(t => t).length}</p>
          <p><strong>Institutions:</strong> ${Array.from(new Set(state.filtered.map(p => p.institution))).filter(i => i).length}</p>
        </div>
      </div>
    `;
  }
}

function updateKnowledgeGraph() {
  console.log('🔄 Updating Knowledge Graph with current filters...');
  
  // Rebuild data with current filtered projects
  buildKnowledgeGraphData();
  
  // Re-render the graph
  renderKnowledgeGraph();
}

function showKGTooltip(nodeData, event) {
  // Create or update tooltip
  let tooltip = d3.select('body').select('.kg-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'kg-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('border', '1px solid rgba(255, 255, 255, 0.2)')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('opacity', 0);
  }
  
  // Generate tooltip content based on node type
  let content = `<strong>${nodeData.label}</strong><br>`;
  content += `<em>Type: ${nodeData.type}</em><br>`;
  content += `<em>Connections: ${nodeData.size}</em><br>`;
  
  if (nodeData.data) {
    if (nodeData.data.projects && nodeData.data.projects.length > 0) {
      content += `<br><strong>Projects (${nodeData.data.projects.length}):</strong><br>`;
      content += nodeData.data.projects.slice(0, 3).map(p => `• ${p.substring(0, 40)}...`).join('<br>');
      if (nodeData.data.projects.length > 3) {
        content += `<br>• ... and ${nodeData.data.projects.length - 3} more`;
      }
    }
    
    if (nodeData.data.researchers && nodeData.data.researchers.size > 0) {
      content += `<br><strong>Researchers:</strong> ${Array.from(nodeData.data.researchers).slice(0, 3).join(', ')}`;
    }
    
    if (nodeData.data.institutions && nodeData.data.institutions.size > 0) {
      content += `<br><strong>Institutions:</strong> ${Array.from(nodeData.data.institutions).slice(0, 2).join(', ')}`;
    }
    
    if (nodeData.data.totalFunding && nodeData.data.totalFunding > 0) {
      content += `<br><strong>Total Funding:</strong> $${nodeData.data.totalFunding.toLocaleString()}`;
    }
  }
  
  tooltip.html(content)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .transition()
    .duration(200)
    .style('opacity', 1);
}

function hideKGTooltip() {
  d3.select('body').select('.kg-tooltip')
    .transition()
    .duration(200)
    .style('opacity', 0);
}

function showKGInfo(nodeData) {
  const infoPanel = document.getElementById('kgInfoPanel');
  const infoContent = document.getElementById('kgInfoContent');
  
  if (!infoPanel || !infoContent) return;
  
  let content = `<h4>${nodeData.label}</h4>`;
  content += `<p><strong>Type:</strong> ${nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)}</p>`;
  content += `<p><strong>Connections:</strong> ${Math.floor(nodeData.size)}</p>`;
  
  if (nodeData.data) {
    if (nodeData.data.description) {
      content += `<p><strong>Description:</strong> ${nodeData.data.description.substring(0, 150)}...</p>`;
    }
    
    if (nodeData.data.year) {
      content += `<p><strong>Year:</strong> ${nodeData.data.year}</p>`;
    }
    
    if (nodeData.data.funding) {
      content += `<p><strong>Funding:</strong> ${nodeData.data.funding}</p>`;
    }
    
    if (nodeData.data.projects && nodeData.data.projects.length > 0) {
      content += `<div class="connections"><strong>Connected Projects:</strong><br>`;
      nodeData.data.projects.slice(0, 5).forEach(project => {
        content += `<span class="connection-item">${project.substring(0, 30)}...</span>`;
      });
      if (nodeData.data.projects.length > 5) {
        content += `<span class="connection-item">+${nodeData.data.projects.length - 5} more</span>`;
      }
      content += `</div>`;
    }
    
    if (nodeData.data.researchers && nodeData.data.researchers.size > 0) {
      content += `<div class="connections"><strong>Researchers:</strong><br>`;
      Array.from(nodeData.data.researchers).slice(0, 5).forEach(researcher => {
        content += `<span class="connection-item">${researcher}</span>`;
      });
      content += `</div>`;
    }
    
    if (nodeData.data.institutions && nodeData.data.institutions.size > 0) {
      content += `<div class="connections"><strong>Institutions:</strong><br>`;
      Array.from(nodeData.data.institutions).slice(0, 3).forEach(institution => {
        content += `<span class="connection-item">${institution}</span>`;
      });
      content += `</div>`;
    }
  }
  
  infoContent.innerHTML = content;
  infoPanel.classList.add('visible');
  
  // Hide after 10 seconds
  setTimeout(() => {
    infoPanel.classList.remove('visible');
  }, 10000);
}

// =====================================
// 3D ISS Research Timeline System
// =====================================

class ISSTimeline {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.issModel = null;
    this.modules = [];
    this.currentYear = 2000;
    this.isPlaying = false;
    this.timelineData = this.generateTimelineData();
    this.autoRotate = true;
    
    this.init();
  }
  
  init() {
    if (!document.getElementById('issViewer')) {
      console.log('ISS Viewer container not found, skipping 3D ISS initialization');
      return;
    }
    
    this.initThreeJS();
    this.createISSModel();
    this.setupEventListeners();
    this.initTimeline();
    this.animate();
    
    console.log('🚀 3D ISS Research Timeline initialized');
  }
  
  initThreeJS() {
    const container = document.getElementById('issViewer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Remove loading indicator and add renderer
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);
    
    // Basic camera controls (manual implementation)
    this.setupBasicControls();
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Stars
    this.createStarField();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  setupBasicControls() {
    // Manual camera control implementation
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.cameraDistance = 100;
    this.cameraAngleX = 0;
    this.cameraAngleY = 0;
    
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    canvas.addEventListener('mousemove', (event) => {
      if (!this.isDragging) return;
      
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      
      this.cameraAngleY += deltaX * 0.01;
      this.cameraAngleX += deltaY * 0.01;
      
      // Limit vertical rotation
      this.cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraAngleX));
      
      this.updateCameraPosition();
      
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.cameraDistance += event.deltaY * 0.1;
      this.cameraDistance = Math.max(20, Math.min(200, this.cameraDistance));
      this.updateCameraPosition();
    });
  }
  
  updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    const y = this.cameraDistance * Math.sin(this.cameraAngleX);
    const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }
  
  createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }
  
  createISSModel() {
    // Create simplified ISS structure
    this.issModel = new THREE.Group();
    
    // Central truss (main backbone)
    const trussGeometry = new THREE.BoxGeometry(60, 2, 2);
    const trussMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const truss = new THREE.Mesh(trussGeometry, trussMaterial);
    this.issModel.add(truss);
    
    // Solar panel arrays
    this.createSolarPanels();
    
    // ISS Modules
    this.createModules();
    
    this.scene.add(this.issModel);
  }
  
  createSolarPanels() {
    const panelGeometry = new THREE.BoxGeometry(20, 0.1, 8);
    const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });
    
    // Port solar panels
    const portPanels = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-40, 0, (i - 1.5) * 10);
      portPanels.add(panel);
    }
    this.issModel.add(portPanels);
    
    // Starboard solar panels
    const starboardPanels = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(40, 0, (i - 1.5) * 10);
      starboardPanels.add(panel);
    }
    this.issModel.add(starboardPanels);
  }
  
  createModules() {
    const moduleConfigs = [
      { name: 'Unity (Node 1)', position: [0, 0, 0], color: 0xffffff, size: [4, 4, 4] },
      { name: 'Destiny (US Lab)', position: [8, 0, 0], color: 0xffdd44, size: [8, 4, 4] },
      { name: 'Harmony (Node 2)', position: [16, 0, 0], color: 0xffffff, size: [4, 4, 4] },
      { name: 'Columbus (ESA Lab)', position: [0, 6, 0], color: 0x4488ff, size: [6, 4, 4] },
      { name: 'Kibo (JEM)', position: [0, -6, 0], color: 0xff4444, size: [10, 4, 4] },
      { name: 'Tranquility (Node 3)', position: [-8, 0, 0], color: 0xffffff, size: [4, 4, 4] },
      { name: 'Cupola', position: [-8, 0, -6], color: 0x88ff88, size: [3, 3, 3] },
      { name: 'Zvezda (Service Module)', position: [-20, 0, 0], color: 0xffaa00, size: [12, 4, 4] },
      { name: 'Zarya (FGB)', position: [-32, 0, 0], color: 0xaa8800, size: [12, 4, 4] }
    ];
    
    moduleConfigs.forEach((config, index) => {
      const geometry = new THREE.BoxGeometry(...config.size);
      const material = new THREE.MeshLambertMaterial({ 
        color: config.color,
        transparent: true,
        opacity: 0.9 
      });
      
      const module = new THREE.Mesh(geometry, material);
      module.position.set(...config.position);
      module.userData = {
        name: config.name,
        index: index,
        originalColor: config.color,
        research: this.getModuleResearch(config.name)
      };
      
      // Add click handler
      module.callback = () => this.onModuleClick(module);
      
      this.modules.push(module);
      this.issModel.add(module);
    });
    
    // Setup raycaster for clicking
    this.setupRaycaster();
  }
  
  getModuleResearch(moduleName) {
    // Map research projects to ISS modules based on typical usage
    const moduleResearch = {
      'Destiny (US Lab)': state.projects.filter(p => 
        p.title && (
          p.title.toLowerCase().includes('cell') ||
          p.title.toLowerCase().includes('protein') ||
          p.title.toLowerCase().includes('crystal')
        )
      ).slice(0, 5),
      
      'Kibo (JEM)': state.projects.filter(p => 
        p.title && (
          p.title.toLowerCase().includes('plant') ||
          p.title.toLowerCase().includes('biology') ||
          p.title.toLowerCase().includes('growth')
        )
      ).slice(0, 4),
      
      'Columbus (ESA Lab)': state.projects.filter(p => 
        p.title && (
          p.title.toLowerCase().includes('material') ||
          p.title.toLowerCase().includes('physics') ||
          p.title.toLowerCase().includes('fluid')
        )
      ).slice(0, 3),
      
      'Cupola': state.projects.filter(p => 
        p.title && (
          p.title.toLowerCase().includes('earth') ||
          p.title.toLowerCase().includes('observation') ||
          p.title.toLowerCase().includes('imaging')
        )
      ).slice(0, 2),
      
      'Tranquility (Node 3)': state.projects.filter(p => 
        p.title && (
          p.title.toLowerCase().includes('exercise') ||
          p.title.toLowerCase().includes('human') ||
          p.title.toLowerCase().includes('health')
        )
      ).slice(0, 3)
    };
    
    return moduleResearch[moduleName] || [];
  }
  
  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.renderer.domElement.addEventListener('click', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modules);
      
      if (intersects.length > 0) {
        this.onModuleClick(intersects[0].object);
      }
    });
    
    // Hover effects
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modules);
      
      // Reset all modules
      this.modules.forEach(module => {
        module.material.color.setHex(module.userData.originalColor);
        module.material.opacity = 0.9;
      });
      
      if (intersects.length > 0) {
        const hoveredModule = intersects[0].object;
        hoveredModule.material.color.setHex(0xffffff);
        hoveredModule.material.opacity = 1.0;
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    });
  }
  
  onModuleClick(module) {
    console.log('🔍 Clicked on ISS module:', module.userData.name);
    
    // Update info panel
    const title = document.getElementById('issModuleTitle');
    const content = document.getElementById('issInfoContent');
    
    if (title && content) {
      title.textContent = module.userData.name;
      
      const research = module.userData.research;
      if (research && research.length > 0) {
        content.innerHTML = `
          <p><strong>Research Projects conducted in ${module.userData.name}:</strong></p>
          ${research.map(project => `
            <div class="module-research-item" onclick="openDetail('${project.id}')">
              <div class="module-research-title">${this.cleanTitle(project.title)}</div>
              <div class="module-research-details">
                ${project.piName || 'NASA Research Team'} • ${project.year}
                ${project.topic ? ` • ${project.topic}` : ''}
              </div>
            </div>
          `).join('')}
        `;
      } else {
        content.innerHTML = `
          <p><strong>${module.userData.name}</strong></p>
          <p>This module serves critical functions for ISS operations and scientific research. Various experiments and observations are conducted here as part of ongoing space research programs.</p>
          <div class="module-research-item">
            <div class="module-research-title">Ongoing Research Activities</div>
            <div class="module-research-details">Multiple research projects utilize this module's unique capabilities</div>
          </div>
        `;
      }
    }
    
    // Highlight selected module
    this.modules.forEach(m => {
      m.material.color.setHex(m.userData.originalColor);
      m.material.opacity = 0.9;
    });
    module.material.color.setHex(0x00ff00);
    module.material.opacity = 1.0;
    
    // Focus camera on module (smooth transition could be added here)
    console.log('Focused on module:', module.userData.name);
  }
  
  cleanTitle(title) {
    if (!title) return 'Untitled Research';
    if (title.includes('\\n')) {
      const lines = title.split('\\n').filter(l => l.trim());
      for(let line of lines) {
        if (line && !line.match(/^[A-Z][a-z]+\s+[A-Z]/) && !line.includes('doi.org')) {
          return line.substring(0, 60) + (line.length > 60 ? '...' : '');
        }
      }
    }
    return title.substring(0, 60) + (title.length > 60 ? '...' : '');
  }
  
  generateTimelineData() {
    const timeline = [];
    const startYear = 2000;
    const currentYear = new Date().getFullYear();
    
    for (let year = startYear; year <= currentYear; year++) {
      const projectsThisYear = state.projects.filter(p => p.year === year);
      timeline.push({
        year: year,
        projects: projectsThisYear,
        milestone: this.getYearMilestone(year),
        researchCount: projectsThisYear.length
      });
    }
    
    return timeline;
  }
  
  getYearMilestone(year) {
    const milestones = {
      2000: 'ISS Construction Begins',
      2001: 'First Permanent Crew',
      2008: 'Columbus & Kibo Addition',
      2010: 'ISS Construction Complete',
      2011: 'Space Shuttle Retirement',
      2020: 'Commercial Crew Begins',
      2024: 'ISS Research Peak'
    };
    
    return milestones[year] || `${state.projects.filter(p => p.year === year).length} Research Projects`;
  }
  
  setupEventListeners() {
        // Auto rotate toggle
    const autoRotateBtn = document.getElementById('issAutoRotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        autoRotateBtn.classList.toggle('active', this.autoRotate);
      });
    }    // Reset view
    const resetBtn = document.getElementById('issReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.cameraDistance = 100;
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
        this.updateCameraPosition();
      });
    }
    
    // Timeline controls
    this.setupTimelineControls();
    
    // Info panel close
    const infoClose = document.getElementById('issInfoClose');
    if (infoClose) {
      infoClose.addEventListener('click', () => {
        const title = document.getElementById('issModuleTitle');
        const content = document.getElementById('issInfoContent');
        if (title) title.textContent = 'Select an ISS Module';
        if (content) content.innerHTML = '<p>Click on any ISS module to explore the research projects conducted there.</p>';
        
        // Reset module highlighting
        this.modules.forEach(m => {
          m.material.color.setHex(m.userData.originalColor);
          m.material.opacity = 0.9;
        });
      });
    }
  }
  
  setupTimelineControls() {
    const playBtn = document.getElementById('timelinePlay');
    const pauseBtn = document.getElementById('timelinePause');
    const resetBtn = document.getElementById('timelineReset');
    
    if (playBtn) {
      playBtn.addEventListener('click', () => this.playTimeline());
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseTimeline());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetTimeline());
    }
    
    this.initTimelineMarkers();
  }
  
  initTimelineMarkers() {
    const markersContainer = document.getElementById('timelineMarkers');
    if (!markersContainer) return;
    
    markersContainer.innerHTML = '';
    
    this.timelineData.forEach((data, index) => {
      if (data.researchCount > 0) {
        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        marker.style.left = `${(index / (this.timelineData.length - 1)) * 100}%`;
        marker.title = `${data.year}: ${data.researchCount} projects`;
        
        marker.addEventListener('click', () => {
          this.jumpToYear(data.year);
        });
        
        markersContainer.appendChild(marker);
      }
    });
  }
  
  playTimeline() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.animateTimeline();
  }
  
  pauseTimeline() {
    this.isPlaying = false;
  }
  
  resetTimeline() {
    this.isPlaying = false;
    this.currentYear = 2000;
    this.updateTimelineDisplay();
  }
  
  jumpToYear(year) {
    this.currentYear = year;
    this.updateTimelineDisplay();
    this.highlightActiveResearch();
  }
  
  animateTimeline() {
    if (!this.isPlaying) return;
    
    const maxYear = Math.max(...this.timelineData.map(d => d.year));
    
    if (this.currentYear < maxYear) {
      this.currentYear++;
      this.updateTimelineDisplay();
      this.highlightActiveResearch();
      
      setTimeout(() => this.animateTimeline(), 1000); // 1 second per year
    } else {
      this.isPlaying = false;
    }
  }
  
  updateTimelineDisplay() {
    const progress = document.getElementById('timelineProgress');
    const yearDisplay = document.getElementById('currentYear');
    const missionsDisplay = document.getElementById('currentMissions');
    
    const currentData = this.timelineData.find(d => d.year === this.currentYear);
    const progressPercent = ((this.currentYear - 2000) / (Math.max(...this.timelineData.map(d => d.year)) - 2000)) * 100;
    
    if (progress) progress.style.width = `${progressPercent}%`;
    if (yearDisplay) yearDisplay.textContent = this.currentYear;
    if (missionsDisplay) {
      missionsDisplay.textContent = currentData ? currentData.milestone : '';
    }
  }
  
  highlightActiveResearch() {
    const currentData = this.timelineData.find(d => d.year === this.currentYear);
    
    if (currentData && currentData.projects.length > 0) {
      // Highlight modules with active research
      this.modules.forEach(module => {
        const hasActiveResearch = module.userData.research.some(r => 
          currentData.projects.some(p => p.id === r.id)
        );
        
        if (hasActiveResearch) {
          module.material.emissive.setHex(0x004400);
        } else {
          module.material.emissive.setHex(0x000000);
        }
      });
    } else {
      // Reset all modules
      this.modules.forEach(module => {
        module.material.emissive.setHex(0x000000);
      });
    }
  }
  
  initTimeline() {
    this.updateTimelineDisplay();
  }
  
  handleResize() {
    const container = document.getElementById('issViewer');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Auto rotate ISS
    if (this.autoRotate && this.issModel) {
      this.issModel.rotation.y += 0.005;
    }
    
    // Slight rotation for visual appeal
    if (this.issModel) {
      this.issModel.rotation.y += 0.001;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize 3D ISS Timeline
let issTimeline = null;

// Initialize when DOM ready
if(document.readyState==='loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    // Initialize ISS Timeline after main app
    setTimeout(() => {
      issTimeline = new ISSTimeline();
    }, 1000);
  });
} else {
  init();
  // Initialize ISS Timeline after main app
  setTimeout(() => {
    issTimeline = new ISSTimeline();
  }, 1000);
}
