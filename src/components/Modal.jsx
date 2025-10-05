import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)'
  };

  const modalStyle = {
    background: 'linear-gradient(135deg, rgba(11, 61, 145, 0.95) 0%, rgba(76, 26, 79, 0.95) 100%)',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
    border: '2px solid rgba(253, 224, 71, 0.3)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'rgba(252, 61, 33, 0.8)',
    border: 'none',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(252, 61, 33, 0.4)'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <button 
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(252, 61, 33, 1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(252, 61, 33, 0.8)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;