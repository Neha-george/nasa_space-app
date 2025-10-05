import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  const inputStyle = {
    padding: '12px 20px',
    borderRadius: '30px',
    border: '2px solid rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(76, 26, 79, 0.3)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    minWidth: '320px',
    backdropFilter: 'blur(15px)',
    outline: 'none',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  };

  const placeholderStyle = {
    color: 'rgba(255, 255, 255, 0.7)'
  };

  return (
    <div>
      <label style={{ 
        marginRight: '15px', 
        fontSize: '16px', 
        fontWeight: '600',
        color: 'var(--aurora-green)',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center'
      }}>
        🔍 Search:
      </label>
      <input
        type="text"
        style={inputStyle}
        placeholder="Search projects, PIs, or institutions..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <style jsx>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
};

export default SearchBar;