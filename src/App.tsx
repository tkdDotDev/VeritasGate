import React from 'react';
import { Layout } from './components/Layout.js';
import { WalletConnect } from './components/WalletConnect.js';
import { WhistleblowerReport } from './components/WhistleblowerReport.js';
import { useMidnight } from './hooks/useMidnight.js';
import { Shield, EyeOff, HardDrive, Cpu, Lock } from 'lucide-react';

export function App() {
  const wallet = useMidnight();

  return (
    <Layout>
      <section className="overview-banner">
        <div className="overview-header">
          <Shield className="icon-blue" size={22} />
          <h2>Zero-Knowledge Corporate Whistleblower Portal</h2>
        </div>
        <p className="overview-desc">
          Veritas Gate enables verified employees to report corporate misconduct, accounting fraud, safety
          breaches, and ethics violations without exposing their identity. Report data is encrypted locally
          and anchored to the Midnight blockchain via Zero-Knowledge proofs.
        </p>

        <div className="architecture-badges">
          <span className="arch-badge">
            <EyeOff size={13} className="icon-teal" /> Whistleblower Anonymity (Zero Leakage)
          </span>
          <span className="arch-badge">
            <Lock size={13} className="icon-blue" /> Client-Side AES-256-GCM
          </span>
          <span className="arch-badge">
            <HardDrive size={13} className="icon-muted" /> Decentralized IPFS Off-Chain Storage
          </span>
          <span className="arch-badge">
            <Cpu size={13} className="icon-teal" /> Compact ZK Circuit Verification
          </span>
        </div>
      </section>

      <WalletConnect wallet={wallet} />

      <WhistleblowerReport wallet={wallet} />
    </Layout>
  );
}

export default App;
