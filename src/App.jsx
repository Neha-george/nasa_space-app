import React, { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import ProjectTable from './components/ProjectTable';
import TopicFilter from './components/TopicFilter';
import SearchBar from './components/SearchBar';
import TrendChart from './components/TrendChart';
import ProjectDetailModal from './components/ProjectDetailModal';
import { nasaProjectsData } from './data/nasaProjects';
import './App.css';

function App() {
  const [projects, setProjects] = useState(nasaProjectsData);
  const [filteredProjects, setFilteredProjects] = useState(nasaProjectsData);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    let filtered = projects;

    // Filter by topic
    if (selectedTopic !== 'All') {
      filtered = filtered.filter(project => project.topic === selectedTopic);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.piName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.institution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, selectedTopic, searchTerm]);

  const topics = ['All', ...new Set(projects.map(p => p.topic))];

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 BioQuest: NASA Research Knowledge Graph</h1>
        <p>Explore NASA-funded bioscience and physical science research projects</p>
      </header>

      <div className="controls">
        <TopicFilter 
          topics={topics}
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
        />
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      <div className="dashboard">
        <div className="network-section">
          <h2>Project Connections</h2>
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(253, 224, 71, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(253, 224, 71, 0.3)'
          }}>
            <span style={{ color: 'var(--saturn-gold)', fontSize: '14px', fontWeight: '600' }}>
              💡 Click on yellow project nodes in the graph or "View Details" in the table to see full project information
            </span>
          </div>
          <NetworkGraph projects={filteredProjects} onProjectClick={handleProjectClick} />
        </div>

        <div className="table-section">
          <h2>Project Details</h2>
          <ProjectTable projects={filteredProjects} onProjectClick={handleProjectClick} />
        </div>

        <div className="trends-section">
          <h2>Research Trends</h2>
          <TrendChart projects={filteredProjects} />
        </div>
      </div>

      <ProjectDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
    </div>
  );
}

export default App;