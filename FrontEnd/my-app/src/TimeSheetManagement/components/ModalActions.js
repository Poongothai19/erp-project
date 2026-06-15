import React from 'react';
import { Save } from 'lucide-react';

const ModalActions = React.memo(({ 
  onCancel, 
  onSave, 
  saveDisabled = false, 
  saveText = 'Save',
  isLoading = false 
}) => (
  <div className="mts-emp-modal-actions">
    <button 
      onClick={onCancel}
      className="mts-emp-modal-btn mts-emp-modal-btn-cancel"
      type="button"
      disabled={isLoading}
    >
      Cancel
    </button>
    <button 
      onClick={onSave}
      className="mts-emp-modal-btn mts-emp-modal-btn-save"
      disabled={saveDisabled || isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <div className="mts-loading" />
          Saving...
        </>
      ) : (
        <>
          <Save size={16} />
          {saveText}
        </>
      )}
    </button>
  </div>
));

ModalActions.displayName = 'ModalActions';

export default ModalActions;
