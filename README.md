# Veritas Gate

> Privacy-preserving corporate whistleblower reporting powered by Midnight.

## Contract Address

| Network | Address                                                              |
| ------- | -------------------------------------------------------------------- |
| Preview | `0xf39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b0006a7cc4f0` |
| Preprod | `0x6a7cc4f0f39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b000` |

---

## What This Does

**Veritas Gate** is a decentralized, privacy-first corporate whistleblower portal built on the **Midnight Network**. It allows employees to report corporate fraud, safety violations, harassment, bribery, or ethics breaches without fear of retaliation or exposure.

Using Midnight's Zero-Knowledge Compact smart contracts, employees can cryptographically prove they are authorized corporate insiders with valid reporting credentials while keeping their real name, employee ID, department, and contact information 100% private.

---

## Privacy Model

### Public

- Report cryptographic fingerprint / IPFS CID hash (`submittedReports: Set<Bytes<32>>`)
- Global submission counter (`reportCount: Counter`)
- Necessary on-chain verification parameters

### Private

- Employee identity (name, email, employee ID, department)
- Corporate authorization secret and private credentials
- Plaintext report description and incident category
- Attached PDF evidence, document contents, and metadata
- Sensitive private witness inputs

### What the User Proves

Through Zero-Knowledge circuit execution, the whistleblower proves:

1. **Insider Authorization**: The submitter possesses an authorized corporate credential/secret.
2. **Integrity & Freshness**: The 32-byte report fingerprint conforms to submission rules and has not been submitted previously (duplicate prevention).
3. **Zero Identity Leakage**: No trace of the submitter's identity or private credential is ever stored on-chain or leaked through public transactions.

---

## Tiny On-Chain Footprint

Veritas Gate follows a lightweight, off-chain data design pattern:

- **Heavy Media Off-Chain**: Full report text, PDF documents, and multimedia evidence files are encrypted client-side and stored in decentralized off-chain storage (IPFS/Arweave).
- **Minimal On-Chain Storage**: Midnight stores only the 32-byte cryptographic fingerprint (`Bytes<32>`) and verification counter on-chain.
- **Zero-Knowledge Efficiency**: Midnight verifies the proof and updates state with minimal ledger overhead, preserving scalability and throughput.

---

## Tech Stack

- **Midnight Network**: Data-protection blockchain for zero-knowledge smart contracts.
- **Compact**: Smart contract programming language for Midnight.
- **Node.js**: v22 LTS runtime.
- **Docker**: Local Midnight Proof Server environment (`midnightnetwork/proof-server:latest`).
- **IPFS / Off-Chain Encrypted Storage**: Secure, decentralized encrypted document storage.
- **Zero-Knowledge Proofs (ZKP)**: Compact ZKIR circuits & Proving Keys.
- **Midnight Lace Wallet**: Web3 browser extension for key management and network transactions.
- **TypeScript / Vitest**: Type safety, test runner, and deployment pipelines (React frontend in Level 2).

---

## Prerequisites

- **Node.js**: v22 or higher (`node -v`)
- **Docker Desktop**: Running locally (`docker ps`)
- **Compact Compiler**: `compactc` v0.31.1 (`~/.compact/bin/compactc`)
- **WSL (Windows Subsystem for Linux)**: For Windows environments

---

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd VeritasGate
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the Midnight Proof Server (Docker):**

   ```bash
   docker run -d --name midnight-proof-server -p 6300:6300 midnightnetwork/proof-server:latest
   ```

4. **Compile the Compact contract:**
   ```bash
   npm run compile
   ```
   This generates the TypeScript contract interface, ZKIR circuits, and proving/verifying keys in `managed/`.

---

## Run Tests

Run the full automated test suite covering Authorization, State Mutation, Duplicate Protection, and Privacy Guarantees:

```bash
npm test
```

---

## Contract Deployment

Deploy to the Midnight **Preview** or **Preprod** network:

```bash
npm run deploy:preview
```

_Note: For live testnet transaction signing, set your funded wallet seed phrase in your environment:_

```bash
MIDNIGHT_WALLET_SEED="your twelve or twenty-four word seed phrase" npm run deploy:preview
```

---

## Initial Idea

Veritas Gate is a privacy-preserving corporate whistleblower reporting portal on the Midnight blockchain. It enables verified employees to submit encrypted misconduct reports and cryptographic fingerprints off chain and on-chain without revealing their identity, employee ID, department, or sensitive report contents.

---

## Screenshots

### Contract Compilation

![Successful Contract Compilation](screenshots/compile-success.png)

### Contract Deployment

![Successful Contract Deployment](screenshots/deployment-success.png)
