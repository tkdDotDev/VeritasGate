# Veritas Gate

![CI](https://github.com/SarthakKshirsagar01/VeritasGate/actions/workflows/ci.yml/badge.svg)

> A privacy-preserving corporate whistleblower portal powered by Midnight.

## Live Demo

🔗 **[https://veritasgate.netlify.app](https://veritasgate.netlify.app)**

---

## Contract Address

| Network | Address |
|----------|---------|
| Preprod | `0x6a7cc4f0f39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b000` |
| Preview | `0xf39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b0006a7cc4f0` |

---

## What This Does

**Veritas Gate** is a decentralized, privacy-first corporate whistleblower portal built on the **Midnight Network**. It provides employees with a secure, anonymous channel to report accounting fraud, bribery, safety violations, harassment, or ethics breaches without fear of retaliation, exposure, or employer surveillance.

## Problem

Whistleblowers face significant risks when reporting corporate misconduct, including retaliation, job loss, or legal action. Existing reporting mechanisms (hotlines, internal portals, email) rely on a trusted third party or employer to protect their identity. On public blockchains, submitting reports leaves a permanent, traceable metadata trail (wallet addresses, timestamps, payload sizes) that can deanonymize the reporter. 

## Solution

Veritas Gate uses the Midnight blockchain's Zero-Knowledge capabilities to allow employees to prove their authorization to submit a report without revealing who they are, what their authorization credential is, or the contents of their report.

## How It Works

1. **Wallet Authorization**: The employee connects their Midnight Lace Wallet. The wallet address is used solely for sponsoring transaction fees.
2. **Report Creation**: The employee writes a detailed description and attaches PDF evidence.
3. **Client-Side Encryption**: All report text and documents are encrypted locally with **AES-256-GCM**.
4. **Off-Chain IPFS Archival**: The encrypted payload is uploaded to decentralized storage, generating a CID.
5. **Fingerprint Calculation**: A 32-byte cryptographic SHA-256 fingerprint is computed from the encrypted envelope.
6. **Local Zero-Knowledge Proof**: The Midnight Compact circuit executes locally with the employee's authorization secret as a private witness.
7. **On-Chain Settlement**: Midnight verifies the ZK proof on the Preprod Network, checks duplicate protection, and registers the fingerprint.

## Privacy Model

### Public
- Report cryptographic fingerprint / IPFS CID hash (`submittedReports: Set<Bytes<32>>`)
- Global submission counter (`reportCount: Counter`)

### Private
- Employee identity (name, email, employee ID, department)
- Corporate authorization secret and private credentials
- Plaintext misconduct description and narrative
- Attached PDF documents, photos, and evidence files

### Proved Without Revealing
Through Zero-Knowledge circuit execution, the whistleblower proves to the Midnight blockchain that:
1. **They are an authorized corporate employee** possessing a valid credential.
2. **The report fingerprint is fresh and unique** (duplicate prevention).
3. **Zero Identity Exposure**: The proof succeeds without disclosing the submitter's identity or private credential.

## Tiny On-Chain Footprint

Veritas Gate enforces an ultra-lightweight hybrid architecture:
- **Heavy Media Off-Chain**: Full report text and evidence are encrypted client-side and stored off-chain.
- **Minimal On-Chain State**: Midnight stores only a 32-byte hash and a counter.
- **Zero-Knowledge Verification**: The Midnight Impact VM verifies the validity of the submission with negligible gas consumption.

## Architecture

- **Smart Contract**: Written in Compact for Midnight's ZK circuits.
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons.
- **Cryptography**: Web Crypto API (AES-256-GCM) + SHA-256 for fingerprints.
- **Wallet Integration**: `@midnight-ntwrk/compact-runtime` and Lace DApp Connector.

## Tech Stack

- **Midnight Network**: Data-protection blockchain for Zero-Knowledge smart contracts.
- **Compact**: Smart contract programming language for Midnight.
- **Midnight.js**: SDK for contract interaction and runtime bindings.
- **React 18 + Vite**: High-performance frontend with TypeScript.
- **Midnight Lace Wallet**: Web3 browser extension connector.
- **Node.js**: v22 LTS runtime.

## Prerequisites

- **Node.js**: v22 or higher (`node -v`)
- **Docker Desktop**: Running locally (`docker ps`)
- **Compact Compiler**: `compactc` v0.31.1 (`~/.compact/bin/compactc`)
- **Midnight Lace Wallet**: Browser extension configured for **Preprod Network**

## Setup & Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SarthakKshirsagar01/VeritasGate.git
   cd VeritasGate
   npm install
   ```

2. **Start the Midnight Proof Server (Docker):**
   ```bash
   docker run -d --name midnight-proof-server -p 6300:6300 midnightnetwork/proof-server:latest
   ```

3. **Compile the Compact contract:**
   ```bash
   npm run compile
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Run Tests

Run the complete Vitest test suite to verify ZK logic, duplicate protection, and privacy guarantees:
```bash
npm run test
```

## CI/CD

Continuous Integration via GitHub Actions ensures that:
- Compact compilation succeeds
- The 5-part ZK test suite passes
- The Vite frontend builds cleanly
See `.github/workflows/ci.yml` for configuration.

## Product Proposal

See [PROPOSAL.md](PROPOSAL.md) for details on the product vision, mainnet feasibility, and the data privacy model.
