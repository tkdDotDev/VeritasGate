import React from 'react';
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Power,
  Zap,
} from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight.js';

interface WalletConnectProps {
  wallet: ReturnType<typeof useMidnight>;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ wallet }) => {
  const truncateAddress = (addr: string | null) => {
    if (!addr) return '';
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
        {wallet.status === 'connected' && (
          <span className="badge badge-success">
            <span className="status-indicator live"></span>
            Connected ({wallet.network?.toUpperCase() || 'PREPROD'})
          </span>
        )}
      </div>

      <div className="wallet-card-body">
        {wallet.status === 'connected' ? (
          <div className="connected-view">
            <div className="wallet-info-row">
              <span className="info-label">Transaction Sponsor Address:</span>
              <span className="info-value address-chip" title={wallet.address || ''}>
                {truncateAddress(wallet.address)}
              </span>
            </div>

            <div className="privacy-callout">
              <ShieldCheck className="icon-teal" size={18} />
              <div className="privacy-callout-text">
                <strong>Anonymity Guarantee:</strong> This wallet address is used solely to
                sponsor network gas fees. The Midnight ZK circuit ensures your wallet is{' '}
                <em>cryptographically unlinked</em> from your whistleblower report.
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
          </div>
        ) : (
          <div className="disconnected-view">
            <p className="wallet-description">
              Connect your <strong>Midnight Lace Wallet</strong> to submit zero-knowledge proofs
              to the <strong>Midnight Preprod Network</strong>.
            </p>

            {wallet.status === 'not_installed' && (
              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>Lace Wallet extension not detected in this browser.</p>
                  <div className="alert-actions">
                    <a
                      href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhgahigoampaomi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      Install Lace Extension <ExternalLink size={12} />
                    </a>
                    <span className="divider">•</span>
                    <button
                      onClick={wallet.connectSimulation}
                      className="btn-link text-primary"
                      id="simulate-wallet-btn"
                    >
                      Use Testnet Simulator Mode
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wallet.status === 'error' && (
              <div className="alert alert-error">
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>{wallet.error || 'Connection failed. Please retry.'}</p>
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                onClick={wallet.connect}
                disabled={wallet.status === 'connecting'}
                className="btn btn-primary"
                id="connect-lace-btn"
              >
                <Wallet size={16} />
                <span>
                  {wallet.status === 'connecting'
                    ? 'Connecting to Lace...'
                    : 'Connect Lace Wallet'}
                </span>
              </button>

              <button
                onClick={wallet.connectSimulation}
                className="btn btn-secondary"
                id="demo-mode-btn"
                title="Connect in local testnet simulation mode"
              >
                <Zap size={16} />
                <span>Testnet Simulator</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
