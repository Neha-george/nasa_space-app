import React from 'react';

const ProjectTable = ({ projects, onProjectClick }) => {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const thStyle = {
    background: 'linear-gradient(135deg, rgba(11, 61, 145, 0.8) 0%, rgba(76, 26, 79, 0.8) 100%)',
    color: 'white',
    padding: '15px 12px',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    borderBottom: '2px solid rgba(253, 224, 71, 0.3)'
  };

  const tdStyle = {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '13px'
  };

  const rowStyle = {
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const viewButtonStyle = {
    backgroundColor: 'var(--nasa-red)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(252, 61, 33, 0.3)'
  };

  const containerStyle = {
    maxHeight: '450px',
    overflowY: 'auto',
    borderRadius: '15px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)'
  };

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Project Title</th>
            <th style={thStyle}>PI</th>
            <th style={thStyle}>Institution</th>
            <th style={thStyle}>Topic</th>
            <th style={thStyle}>Year</th>
            <th style={thStyle}>Details</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr 
              key={project.id} 
              style={rowStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={tdStyle} title={project.description}>
                {project.title.length > 30 ? project.title.substring(0, 30) + '...' : project.title}
              </td>
              <td style={tdStyle}>{project.piName}</td>
              <td style={tdStyle}>
                {project.institution.length > 20 ? project.institution.substring(0, 20) + '...' : project.institution}
              </td>
              <td style={tdStyle}>
                <span style={{
                  backgroundColor: getTopicColor(project.topic),
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'white'
                }}>
                  {project.topic}
                </span>
              </td>
              <td style={tdStyle}>{project.year}</td>
              <td style={tdStyle}>
                <button 
                  style={viewButtonStyle}
                  onClick={() => onProjectClick(project)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#DC2626';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--nasa-red)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {projects.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
          No projects found matching your criteria.
        </div>
      )}
    </div>
  );
};

const getTopicColor = (topic) => {
  const colors = {
    'Human Health': '#FC3D21', // NASA Red
    'Plant Biology': '#10B981', // Aurora Green
    'Radiation Protection': '#FDE047', // Saturn Gold
    'Microbiology': '#8B5CF6', // Purple
    'Life Support': '#06B6D4', // Cyan
    'Materials Science': '#FB923C', // Mars Orange
    'Psychology': '#EC4899', // Pink
    'Physics': '#3B82F6', // Blue
    'Biotechnology': '#10B981' // Green
  };
  return colors[topic] || '#6B7280';
};

export default ProjectTable;