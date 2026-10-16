import React from "react";
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Power,
} from "lucide-react";
import { useMidnight } from "../hooks/useMidnight.js";
import { deployVeritasGateContract } from "../utils/contract.js";

interface WalletConnectProps {
  wallet: ReturnType<typeof useMidnight>;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ wallet }) => {
  const [deploymentStatus, setDeploymentStatus] = React.useState<
    "idle" | "deploying" | "deployed" | "error"
  >("idle");
  const [deployedAddress, setDeployedAddress] = React.useState<string | null>(
    () => localStorage.getItem("veritas-gate-contract-address"),
  );
  const [deploymentError, setDeploymentError] = React.useState<string | null>(
    null,
  );

  const handleDeploy = async () => {
    if (!wallet.walletApi) return;

    setDeploymentStatus("deploying");
    setDeploymentError(null);
    try {
      const result = await deployVeritasGateContract(wallet.walletApi);
      localStorage.setItem("veritas-gate-contract-address", result.contractAddress);
      setDeployedAddress(result.contractAddress);
      setDeploymentStatus("deployed");
    } catch (error: any) {
      setDeploymentError(error?.message || "Contract deployment failed.");
      setDeploymentStatus("error");
    }
  };

  const truncateAddress = (addr: string | null) => {
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  return (
    <div className="wallet-card">
      <div className="wallet-card-header">
        <div className="wallet-card-title">
          <Wallet className="icon-blue" size={20} />
          <span>Midnight Wallet Authorization</span>
        </div>
        {wallet.status === "connected" && (
          <span className="badge badge-success">
            <span className="status-indicator live"></span>
            Connected ({wallet.network?.toUpperCase() || "PREPROD"})
          </span>
        )}
      </div>

      <div className="wallet-card-body">
        {wallet.status === "connected" ? (
          <div className="connected-view">
            <div className="wallet-info-row">
              <span className="info-label">Transaction Sponsor Address:</span>
              <span
                className="info-value address-chip"
                title={wallet.address || ""}
              >
                {truncateAddress(wallet.address)}
              </span>
            </div>

            <div className="privacy-callout">
              <ShieldCheck className="icon-teal" size={18} />
              <div className="privacy-callout-text">
                <strong>Anonymity Guarantee:</strong> This wallet address is
                used solely to sponsor network gas fees. The Midnight ZK circuit
                ensures your wallet is <em>cryptographically unlinked</em> from
                your whistleblower report.
              </div>
            </div>

            <button
              onClick={wallet.disconnect}
              className="btn btn-secondary btn-sm"
              id="disconnect-wallet-btn"
            >
              <Power size={14} />
              <span>Disconnect</span>
            </button>
            <button
              onClick={handleDeploy}
              disabled={deploymentStatus === "deploying"}
              className="btn btn-primary btn-sm"
            >
              <ShieldCheck size={14} />
              <span>
                {deploymentStatus === "deploying"
                  ? "Deploying Contract..."
                  : "Deploy Contract to Preprod"}
              </span>
            </button>
            {deployedAddress && (
              <span className="info-value address-chip" title={deployedAddress}>
                Contract: {truncateAddress(deployedAddress)}
              </span>
            )}
            {deploymentError && (
              <div className="alert alert-error">
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>{deploymentError}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="disconnected-view">
            <p className="wallet-description">
              Connect your <strong>1AM Wallet</strong> to submit
              zero-knowledge proofs to the{" "}
              <strong>Midnight Preprod Network</strong>.
            </p>

            {wallet.status === "not_installed" && (
              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>
                    Lace Wallet extension not detected. Install Lace and create
                    a Midnight wallet inside it (Menu → Add new wallet →
                    Midnight).
                  </p>
                  <div className="alert-actions">
                    <a
                      href="https://1am.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      Install 1AM Wallet <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {wallet.status === "error" && (
              <div className="alert alert-error">
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>{wallet.error || "Connection failed. Please retry."}</p>
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                onClick={wallet.connect}
                disabled={wallet.status === "connecting"}
                className="btn btn-primary"
                id="connect-1am-btn"
              >
                <Wallet size={16} />
                <span>
                  {wallet.status === "connecting"
                    ? "Connecting to 1AM..."
                    : "Connect 1AM Wallet"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
