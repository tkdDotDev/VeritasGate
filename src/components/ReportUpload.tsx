import React, { useRef } from 'react';
import { UploadCloud, FileText, Trash2, Shield } from 'lucide-react';

export interface AttachedEvidence {
  name: string;
  type: string;
  size: number;
  buffer: ArrayBuffer;
}

interface ReportUploadProps {
  evidence: AttachedEvidence | null;
  onEvidenceChange: (evidence: AttachedEvidence | null) => void;
  disabled?: boolean;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  evidence,
  onEvidenceChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    // Read file locally as ArrayBuffer for local Web Crypto encryption
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        onEvidenceChange({
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          buffer: reader.result,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="upload-container">
      <label className="form-label">
        <span>Confidential Evidence Attachment (Optional PDF / Document)</span>
        <span className="privacy-badge">
          <Shield size={12} /> Encrypted Client-Side
        </span>
      </label>

      {evidence ? (
        <div className="file-preview-card">
          <div className="file-preview-info">
            <FileText className="icon-blue" size={24} />
            <div className="file-meta">
              <span className="file-name">{evidence.name}</span>
              <span className="file-size">{formatFileSize(evidence.size)} • Ready for AES-256-GCM encryption</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEvidenceChange(null)}
            disabled={disabled}
            className="btn-icon"
            title="Remove attached evidence"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${disabled ? 'dropzone-disabled' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <UploadCloud className="icon-muted" size={32} />
          <p className="dropzone-text">
            <strong>Click to upload</strong> or drag and drop PDF / evidence document
          </p>
          <p className="dropzone-hint">
            File is converted to ciphertext locally in browser memory before IPFS pinning
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
            style={{ display: 'none' }}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
