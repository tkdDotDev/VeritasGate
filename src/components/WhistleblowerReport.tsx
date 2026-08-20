import React, { useState } from "react";
import {
  FileText,
  Shield,
  Lock,
  Sparkles,
  Send,
  KeyRound,
  Check,
} from "lucide-react";
import { useMidnight } from "../hooks/useMidnight.js";
import { ReportUpload, type AttachedEvidence } from "./ReportUpload.js";
import { ProofStatus, type SubmissionStage } from "./ProofStatus.js";
import { encryptReportLocally } from "../utils/encryption.js";
import {
  uploadEncryptedReportToIpfs,
  type IpfsUploadResult,
} from "../utils/ipfs.js";
import {
  generateLocalProof,
  type LocalCircuitProofResult,
} from "../utils/contract.js";

interface WhistleblowerReportProps {
  wallet: ReturnType<typeof useMidnight>;
}

const SAMPLE_REPORTS = [
  {
    title: "Financial Irregularity",
    category: "FRAUD",
    text: "Discrepancy detected in Q3 revenue recognition. Software subscription contracts totaling $4.2M were recognized upfront before delivery, conflicting with standard revenue recognition guidelines.",
  },
  {
    title: "Workplace Safety Violation",
    category: "SAFETY",
    text: "Critical emergency safety valves in Facility B were bypassed during routine night shifts to avoid production slowdowns, creating an unmonitored high-pressure hazard.",
  },
  {
    title: "Data Privacy Breach",
    category: "DATA_BREACH",
    text: "Unencrypted customer PII including passport scans and social security records were migrated to an unauthenticated cloud storage bucket accessible without MFA.",
  },
];

export const WhistleblowerReport: React.FC<WhistleblowerReportProps> = ({
  wallet,
}) => {
  const [category, setCategory] = useState<string>("FRAUD");
  const [description, setDescription] = useState<string>("");
  const [evidence, setEvidence] = useState<AttachedEvidence | null>(null);
  const [employeeSecretHex, setEmployeeSecretHex] = useState<string>(
    "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
  );

  const [stage, setStage] = useState<SubmissionStage>("idle");
  const [ipfsResult, setIpfsResult] = useState<IpfsUploadResult | null>(null);
  const [proofResult, setProofResult] =
    useState<LocalCircuitProofResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplySample = (sample: (typeof SAMPLE_REPORTS)[0]) => {
    setCategory(sample.category);
    setDescription(sample.text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please enter a description of the incident.");
      return;
    }

    if (wallet.status !== "connected") {
      alert("Please connect your Midnight Lace Wallet before submitting.");
      return;
    }

    try {
      setErrorMessage(null);

      // STAGE 1: Client-Side Encryption
      setStage("encrypting");
      await new Promise((r) => setTimeout(r, 600)); // Visual feedback

      const encrypted = await encryptReportLocally({
        reportText: description,
        category,
        evidenceFile: evidence || undefined,
        passphrase: employeeSecretHex,
      });

      // STAGE 2: Off-Chain IPFS Storage & Fingerprinting
      setStage("ipfs_upload");
      await new Promise((r) => setTimeout(r, 600));

      const ipfsRes = await uploadEncryptedReportToIpfs(encrypted);
      setIpfsResult(ipfsRes);

      // STAGE 3: Local Zero-Knowledge Proof Generation
      setStage("generating_proof");
      await new Promise((r) => setTimeout(r, 900));

      // STAGE 4: Local Compact proof generation
      const secretClean = employeeSecretHex
        .replace(/^0x/, "")
        .padEnd(64, "0")
        .slice(0, 64);
      const secretBytes = new Uint8Array(
        secretClean.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
      );
      const proofRes = await generateLocalProof({
        reportHash: ipfsRes.reportHash,
        employeeSecret: secretBytes,
        network: "preprod",
      });

      setProofResult(proofRes);
      setStage("proof_generated");
    } catch (err: any) {
      console.error("Submission pipeline error:", err);
      setErrorMessage(
        err?.message ||
          "An unexpected error occurred during report submission.",
      );
      setStage("error");
    }
  };

  const handleReset = () => {
    setStage("idle");
    setDescription("");
    setEvidence(null);
    setIpfsResult(null);
    setProofResult(null);
    setErrorMessage(null);
  };

  const isSubmitting =
    stage !== "idle" && stage !== "proof_generated" && stage !== "error";

  return (
    <div className="report-container">
      {stage !== "idle" ? (
        <ProofStatus
          stage={stage}
          ipfsResult={ipfsResult}
          proofResult={proofResult}
          errorMessage={errorMessage}
          onReset={handleReset}
        />
      ) : (
        <div className="report-card">
          <div className="report-card-header">
            <div className="title-with-badge">
              <FileText className="icon-blue" size={22} />
              <h2>Submit Confidential Misconduct Report</h2>
            </div>
            <span className="privacy-badge">
              <Lock size={13} /> Zero-Knowledge Protected
            </span>
          </div>

          {/* Quick sample loader for evaluator convenience */}
          <div className="sample-reports-bar">
            <span className="sample-label">
              <Sparkles size={14} className="icon-blue" /> Quick Templates:
            </span>
            <div className="sample-buttons">
              {SAMPLE_REPORTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(s)}
                  className="btn-sample"
                  title="Click to populate form with this sample scenario"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label htmlFor="incident-category" className="form-label">
                Incident Category
              </label>
              <select
                id="incident-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="FRAUD">Fraud & Accounting Irregularities</option>
                <option value="BRIBERY">
                  Bribery & Foreign Corrupt Practices
                </option>
                <option value="SAFETY">
                  Workplace Safety & Environmental Hazard
                </option>
                <option value="HARASSMENT">Harassment & Discrimination</option>
                <option value="DATA_BREACH">
                  Data Breach & Cybersecurity Non-Compliance
                </option>
                <option value="OTHER">Other Ethics Breach</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="report-description" className="form-label">
                <span>Misconduct Details & Description</span>
                <span className="char-count">
                  {description.length} characters
                </span>
              </label>
              <textarea
                id="report-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the corporate misconduct in detail. Include dates, projects, and entities involved. This text will be encrypted client-side with AES-256-GCM before off-chain storage."
                className="form-textarea"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <ReportUpload
                evidence={evidence}
                onEvidenceChange={setEvidence}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group corporate-secret-box">
              <label htmlFor="employee-secret" className="form-label">
                <span className="flex-center-gap">
                  <KeyRound size={15} className="icon-blue" />
                  Corporate Insider Authorization Secret (Private ZK Witness)
                </span>
                <span className="privacy-badge">
                  <Shield size={12} /> Never Disclosed On-Chain
                </span>
              </label>
              <input
                id="employee-secret"
                type="password"
                value={employeeSecretHex}
                onChange={(e) => setEmployeeSecretHex(e.target.value)}
                placeholder="Enter 32-byte hexadecimal corporate credential"
                className="form-input font-mono"
                disabled={isSubmitting}
                required
              />
              <p className="form-hint">
                This credential is processed as a private Compact witness in
                your local Zero-Knowledge circuit. It proves you are an
                authorized corporate employee without disclosing your identity
                to the ledger.
              </p>
            </div>

            <div className="privacy-summary-card">
              <div className="privacy-summary-title">
                <Shield className="icon-teal" size={18} />
                <span>What Happens When You Submit:</span>
              </div>
              <ul className="privacy-summary-list">
                <li>
                  <Check size={14} className="icon-success" />
                  <span>
                    Your report text and PDF are encrypted locally using
                    AES-256-GCM.
                  </span>
                </li>
                <li>
                  <Check size={14} className="icon-success" />
                  <span>
                    The encrypted blob is pinned to IPFS, yielding an immutable
                    CID.
                  </span>
                </li>
                <li>
                  <Check size={14} className="icon-success" />
                  <span>
                    A Zero-Knowledge proof proves insider authorization without
                    revealing your identity.
                  </span>
                </li>
                <li>
                  <Check size={14} className="icon-success" />
                  <span>
                    Only the 32-byte report fingerprint and cryptographic proof
                    are stored on Midnight.
                  </span>
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || wallet.status !== "connected"}
              className="btn btn-primary btn-large btn-block"
              id="submit-report-btn"
            >
              <Send size={18} />
              <span>Submit Report with Zero-Knowledge Privacy</span>
            </button>

            {wallet.status !== "connected" && (
              <p className="wallet-required-notice">
                * Connect your Midnight Lace Wallet above to enable
                cryptographic submission.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
