import React from "react";
import { Shield, Lock, ExternalLink, Github, BookOpen } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-inner container">
          <div className="brand-group">
            <div className="brand-logo">
              <Shield className="logo-icon" size={26} />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-title">VERITAS GATE</h1>
                <span className="network-pill">Midnight Preprod</span>
              </div>
              <p className="brand-tagline">
                Privacy-Preserving Corporate Whistleblower Portal
              </p>
            </div>
          </div>

          <div className="header-links">
            <a
              href="https://github.com/SarthakKshirsagar01/VeritasGate"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              title="GitHub Repository"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              title="Midnight Network Documentation"
            >
              <BookOpen size={16} />
              <span>Midnight Docs</span>
            </a>
          </div>
        </div>
      </header>

      <main className="app-main container">{children}</main>

      <footer className="app-footer">
        <div className="footer-inner container">
          <div className="footer-col">
            <div className="footer-brand">
              <Lock size={16} className="icon-blue" />
              <span>Veritas Gate • Midnight Builder Challenge Level 2</span>
            </div>
            <p className="footer-text">
              Zero-Knowledge governance reporting powered by Compact smart
              contracts on the Midnight Network.
            </p>
          </div>

          <div className="footer-col text-right">
            <div className="footer-contract-label">Network:</div>
            <span className="footer-contract-val">Midnight Preprod</span>
            <div className="footer-links">
              <a
                href="https://faucet.preprod.midnight.network"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Preprod Faucet <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
