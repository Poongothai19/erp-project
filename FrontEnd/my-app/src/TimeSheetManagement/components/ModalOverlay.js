import React, { useEffect } from 'react';

const ModalOverlay = React.memo(({ 
  isOpen, 
  onClose, 
  children,
  closeOnOutsideClick = true,
  closeOnEscape = true
}) => {
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="mts-emp-modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
});

ModalOverlay.displayName = 'ModalOverlay';

export default ModalOverlay;
