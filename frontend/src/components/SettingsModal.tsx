import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Server, Cloud } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppStore();
  const [ollamaHost, setOllamaHost] = useState(settings.ollamaHost);
  const [useCloud, setUseCloud] = useState(settings.useCloud);

  const handleSave = () => {
    updateSettings({
      ollamaHost,
      useCloud,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Settings</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.section}>
            <h3>Ollama Connection</h3>
            
            <div style={styles.connectionType}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={!useCloud}
                  onChange={() => setUseCloud(false)}
                />
                <Server size={18} />
                <span>Local Ollama</span>
              </label>
              
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={useCloud}
                  onChange={() => setUseCloud(true)}
                />
                <Cloud size={18} />
                <span>Ollama Cloud</span>
              </label>
            </div>

            {!useCloud && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Ollama Host URL</label>
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  placeholder="http://localhost:11434"
                  style={styles.input}
                />
                <p style={styles.helpText}>
                  The URL where your local Ollama instance is running
                </p>
              </div>
            )}

            {useCloud && (
              <div style={styles.cloudInfo}>
                <p>Using Ollama Cloud for model inference.</p>
                <p style={styles.helpText}>
                  Make sure you have configured your cloud credentials.
                </p>
              </div>
            )}
          </div>

          <div style={styles.section}>
            <h3>Available Models</h3>
            <p style={styles.helpText}>
              Models will be loaded from your Ollama instance. You can pull new models using the Ollama CLI.
            </p>
            <code style={styles.codeBlock}>
              ollama pull llama3.2<br />
              ollama pull nomic-embed-text
            </code>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.saveButton}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  connectionType: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    flex: 1,
  },
  formGroup: {
    marginTop: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  helpText: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
  },
  cloudInfo: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
  },
  codeBlock: {
    display: 'block',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '13px',
    marginTop: '8px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
