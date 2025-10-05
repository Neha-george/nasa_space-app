import React from 'react';
import Modal from './Modal';

const ProjectDetailModal = ({ isOpen, onClose, project }) => {
  if (!project) return null;

  const headerStyle = {
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid rgba(253, 224, 71, 0.3)'
  };

  const titleStyle = {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--saturn-gold)',
    marginBottom: '10px',
    lineHeight: '1.3',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const yearBadgeStyle = {
    display: 'inline-block',
    backgroundColor: 'var(--nasa-red)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(252, 61, 33, 0.4)'
  };

  const sectionStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--aurora-green)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center'
  };

  const valueStyle = {
    fontSize: '1rem',
    color: 'var(--stellar-white)',
    lineHeight: '1.5',
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const topicBadgeStyle = {
    backgroundColor: getTopicColor(project.topic),
    color: 'white',
    padding: '8px 16px',
    borderRadius: '15px',
    fontSize: '0.95rem',
    fontWeight: '600',
    display: 'inline-block',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  };

  const connectionStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginTop: '10px'
  };

  const connectionItemStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🚀 {project.title}</h2>
        <span style={yearBadgeStyle}>Year: {project.year}</span>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>
          🔬 Research Topic
        </div>
        <div style={topicBadgeStyle}>
          {project.topic}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>
          📝 Project Description
        </div>
        <div style={valueStyle}>
          {project.description}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>
          🌐 Research Connections
        </div>
        <div style={connectionStyle}>
          <div style={connectionItemStyle}>
            <div style={{ color: 'var(--mars-orange)', fontWeight: '600', marginBottom: '5px' }}>
              👨‍🔬 Principal Investigator
            </div>
            <div style={{ color: 'white' }}>{project.piName}</div>
          </div>
          <div style={connectionItemStyle}>
            <div style={{ color: 'var(--aurora-green)', fontWeight: '600', marginBottom: '5px' }}>
              🏛️ Institution
            </div>
            <div style={{ color: 'white' }}>{project.institution}</div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'rgba(253, 224, 71, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(253, 224, 71, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--saturn-gold)', fontSize: '0.9rem', fontWeight: '600' }}>
          🌟 NASA-Funded Research Project
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginTop: '5px' }}>
          Contributing to space exploration and scientific advancement
        </div>
      </div>
    </Modal>
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

export default ProjectDetailModal;