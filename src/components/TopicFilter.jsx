import React from 'react';

const TopicFilter = ({ topics, selectedTopic, onTopicChange }) => {
  const selectStyle = {
    padding: '12px 20px',
    borderRadius: '30px',
    border: '2px solid rgba(253, 224, 71, 0.4)',
    backgroundColor: 'rgba(11, 61, 145, 0.3)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    minWidth: '220px',
    backdropFilter: 'blur(15px)',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  };

  const optionStyle = {
    backgroundColor: 'var(--nasa-blue)',
    color: 'white',
    padding: '8px'
  };

  return (
    <div>
      <label style={{ 
        marginRight: '15px', 
        fontSize: '16px', 
        fontWeight: '600',
        color: 'var(--saturn-gold)',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center'
      }}>
        🛸 Filter by Topic:
      </label>
      <select
        style={selectStyle}
        value={selectedTopic}
        onChange={(e) => onTopicChange(e.target.value)}
      >
        {topics.map(topic => (
          <option key={topic} value={topic} style={optionStyle}>
            {topic}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TopicFilter;