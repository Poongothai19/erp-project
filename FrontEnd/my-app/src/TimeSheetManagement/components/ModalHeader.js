import React from 'react';
import { X } from 'lucide-react';

const ModalHeader = React.memo(({ title, onClose }) => (
  <div className="mts-emp-modal-header">
    <h2 className="mts-emp-modal-title">{title}</h2>
    <button 
      onClick={onClose}
      className="mts-emp-modal-close-btn"
      type="button"
      aria-label="Close modal"
    >
      <X size={20} />
    </button>
  </div>
));

ModalHeader.displayName = 'ModalHeader';

export default ModalHeader;
