# Product Proposal

## What is the product, and who uses it?
Veritas Gate is a privacy-preserving corporate whistleblower portal built on the Midnight blockchain. It provides a secure, anonymous channel for employees to report severe misconduct, financial fraud, bribery, safety violations, and ethical breaches.

The primary users are:
1. **Employees (Whistleblowers)**: Need to report incidents safely without fear of retaliation, exposure, or tracking.
2. **Corporate Compliance / Legal Teams**: Need to receive verifiable, tamper-proof reports and investigate claims while respecting whistleblower anonymity.
3. **Authorized Regulatory/Judicial Authorities**: (Optional, future scope) Need cryptographic proof that a report was submitted at a specific point in time and has not been altered.

## Why Midnight specifically?
A transparent blockchain (like Ethereum or Cardano) would expose too much sensitive information. If a whistleblower submits a report on a public ledger, their transaction metadata, wallet address, and the encrypted payload's size or timing could be correlated with network traffic or employee activity, compromising their identity. Even with privacy workarounds, ensuring zero leakage of the authorization credential while preventing duplicate submissions is difficult and expensive.

Midnight's data-protection blockchain natively solves this through Zero-Knowledge (ZK) smart contracts. Midnight allows Veritas Gate to prove authorization (that the submitter is a verified employee) and uniqueness (that the report hasn't been submitted before) while keeping the actual authorization inputs and report contents entirely private. The public ledger only stores a 32-byte cryptographic hash and a counter, leaving a minimal footprint and maximum privacy.

## Data Model

| Data Point | Type | Disclosed To |
|---|---|---|
| Report fingerprint/CID reference | Public ledger state | Public/authorized observers as implemented |
| Employee authorization secret | Private witness | Never directly disclosed |
| Employee identity | Private | Not disclosed during normal submission |
| Report text | Encrypted off-chain | Authorized users according to access model |
| PDF/evidence | Encrypted off-chain | Authorized users according to access model |
| ZK proof | Cryptographic proof | Blockchain verification/public transaction data |

*Note: The current implementation demonstrates the ZK proof of authorization and duplicate protection. The off-chain encrypted storage is simulated locally via the browser's Web Crypto API.*

## Mainnet Feasibility
Veritas Gate is a proof-of-concept for the Midnight Builder Challenge and is **not yet Mainnet-ready**. 

To reach Mainnet feasibility, the following requirements must be addressed:
- **Technical/Architecture Requirements**: The off-chain storage layer must be formalized (e.g., integrating a pinning service for IPFS or Arweave). The DApp must handle complex network congestion and transaction retry logic.
- **Privacy/Security Requirements**: True privacy requires more than just ZK proofs. Network-level anonymity (e.g., Tor/VPN integration) is needed to prevent IP-based correlation. Evidence files (PDFs/Images) must be automatically scrubbed of EXIF data and metadata before client-side encryption.
- **Wallet Requirements**: Users need a frictionless way to fund their wallets for gas without KYCing themselves, or the portal must implement a robust relayer/gas-station architecture to sponsor transactions blindly.
- **Compliance Requirements**: The system needs a key-escrow or multi-sig decryption model so that compliance officers can actually decrypt and read the reports stored off-chain without a single point of failure.
- **Operational Requirements**: Real-world corporate adoption requires integration with HR systems for secure provisioning of the "employee authorization secret" (e.g., blind signatures or Merkle tree inclusion proofs).
