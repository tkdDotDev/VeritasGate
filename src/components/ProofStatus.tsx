import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  HardDrive,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { SubmissionProofResult } from '../utils/contract.js';
import type { IpfsUploadResult } from '../utils/ipfs.js';

export type SubmissionStage =
  | 'idle'
  | 'encrypting'
  | 'ipfs_upload'
  | 'generating_proof'
  | 'submitting_tx'
  | 'confirmed'
  | 'error';

interface ProofStatusProps {
  stage: SubmissionStage;
  ipfsResult: IpfsUploadResult | null;
  proofResult: SubmissionProofResult | null;
  errorMessage: string | null;
  onReset: () => void;
}

export const ProofStatus: React.FC<ProofStatusProps> = ({
  stage,
  ipfsResult,
  proofResult,
  errorMessage,
  onReset,
}) => {
  if (stage === 'idle') return null;

  const steps = [
    {
      id: 'encrypting',
      title: 'Local Client-Side Encryption',
      desc: 'Encrypting report text & PDF with AES-256-GCM in browser sandbox',
      icon: Lock,
    },
    {
      id: 'ipfs_upload',
      title: 'Off-Chain Storage & Fingerprint',
      desc: 'Deriving IPFS Content Identifier (CID) and 32-byte report fingerprint',
      icon: HardDrive,
    },
    {
      id: 'generating_proof',
      title: 'Local Zero-Knowledge Proof',
      desc: 'Compact circuit proving insider authorization without revealing identity',
      icon: Cpu,
    },
    {
      id: 'submitting_tx',
      title: 'Midnight Preprod Submission',
      desc: 'Submitting cryptographic proof and public fingerprint to ledger',
      icon: Send,
    },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['encrypting', 'ipfs_upload', 'generating_proof', 'submitting_tx', 'confirmed'];
    const currentIndex = order.indexOf(stage);
    const stepIndex = order.indexOf(stepId);

    if (stage === 'error') {
      if (stepIndex === currentIndex) return 'error';
      if (stepIndex < currentIndex) return 'completed';
      return 'pending';
    }

    if (stage === 'confirmed') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="proof-status-card">
      <div className="proof-status-header">
        <div className="title-with-badge">
          <Cpu className="icon-blue" size={22} />
          <h3>Midnight Zero-Knowledge Pipeline</h3>
        </div>
        <div className="privacy-guarantee-pill">
          <ShieldCheck size={14} />
          <span>Proved without revealing your identity.</span>
        </div>
      </div>

      <div className="steps-container">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const StepIcon = step.icon;

          return (
            <div key={step.id} className={`step-item step-${status}`}>
              <div className="step-indicator">
                {status === 'completed' && <CheckCircle2 size={18} className="icon-success" />}
                {status === 'active' && <Loader2 size={18} className="icon-spinning icon-blue" />}
                {status === 'pending' && <span className="step-dot" />}
                {status === 'error' && <AlertCircle size={18} className="icon-error" />}
              </div>

              <div className="step-content">
                <div className="step-title-row">
                  <StepIcon size={16} className="step-icon" />
                  <span className="step-title">{step.title}</span>
                </div>
                <span className="step-desc">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {stage === 'confirmed' && proofResult && ipfsResult && (
        <div className="receipt-container">
          <div className="receipt-banner">
            <CheckCircle2 className="icon-success" size={28} />
            <div>
              <h4>Misconduct Report Verified & Recorded</h4>
              <p>Your report fingerprint is now immutably anchored on Midnight Preprod.</p>
            </div>
          </div>

          <div className="receipt-details">
            <div className="receipt-row">
              <span className="receipt-key">Preprod Contract Address:</span>
              <code className="receipt-val">{proofResult.contractAddress}</code>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Transaction Hash:</span>
              <code className="receipt-val">{proofResult.txHash}</code>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Off-Chain IPFS CID:</span>
              <code className="receipt-val">{ipfsResult.cid}</code>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Public Report Fingerprint (SHA-256):</span>
              <code className="receipt-val">{proofResult.reportHashHex}</code>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Total Reports on Ledger:</span>
              <span className="receipt-val font-bold">{proofResult.reportCount.toString()}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Local Proof Time:</span>
              <span className="receipt-val">{proofResult.proofTimeMs} ms</span>
            </div>
          </div>

          <div className="privacy-confirmation-box">
            <ShieldCheck className="icon-teal" size={20} />
            <div>
              <strong>Complete Privacy Preserved:</strong>
              <p>
                Neither your employee identity, corporate authorization secret, nor unencrypted report text
                were revealed or stored on the Midnight blockchain.
              </p>
            </div>
          </div>

          <button onClick={onReset} className="btn btn-primary btn-block">
            Submit Another Report
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="error-container">
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <div className="alert-content">
              <strong>Submission Error:</strong>
              <p>{errorMessage || 'Failed to submit report. Please check wallet and try again.'}</p>
            </div>
          </div>
          <button onClick={onReset} className="btn btn-secondary btn-block">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
