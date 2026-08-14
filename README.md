# Veritas Gate

> Privacy-preserving corporate whistleblower reporting using Midnight ZK privacy.

---

## Live Demo

🔗 **[https://veritasgate.netlify.app](https://veritasgate.netlify.app)**

---

## Contract Address

<<<<<<< HEAD
| Network | Address |
|---|---|
| **Preprod** | `0x6a7cc4f0f39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b000` |
| **Preview** | `0xf39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b0006a7cc4f0` |
=======
| Network | Address                                                              |
| ------- | -------------------------------------------------------------------- |
| Preview | `0xf39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b0006a7cc4f0` |
| Preprod | `0x6a7cc4f0f39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b000` |
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc

---

## What This Does

**Veritas Gate** is a decentralized, privacy-first corporate whistleblower portal built on the **Midnight Network**. It provides employees with a secure, anonymous channel to report accounting fraud, bribery, safety violations, harassment, or ethics breaches without fear of retaliation, exposure, or employer surveillance.

### End-to-End Whistleblower Workflow:
1. **Wallet Authorization**: The employee connects their Midnight Lace Wallet. The wallet address is used solely for sponsoring transaction fees and is cryptographically unlinked from their reporting identity.
2. **Report Creation & Evidence Attachment**: The employee selects an incident category, writes a detailed description, and optionally attaches PDF evidence.
3. **Client-Side Encryption**: Before leaving the browser sandbox, all report text and documents are encrypted locally with **AES-256-GCM** using the Web Crypto API.
4. **Off-Chain IPFS Archival**: The encrypted payload is uploaded to decentralized storage (IPFS), generating an immutable Content Identifier (**CID**).
5. **Fingerprint Calculation**: A 32-byte cryptographic SHA-256 fingerprint (`reportHash`) is computed from the encrypted envelope.
6. **Local Zero-Knowledge Proof**: The off-chain Midnight Compact circuit executes locally with the employee's corporate authorization secret as a private witness.
7. **On-Chain Settlement**: Midnight verifies the ZK proof on the **Preprod Network**, checks duplicate protection, registers the 32-byte fingerprint in `submittedReports`, and increments the submission counter.

---

## Privacy Model

<<<<<<< HEAD
### Public (On-Chain)
- Cryptographic report fingerprint (`submittedReports: Set<Bytes<32>>`)
=======
### Public

- Report cryptographic fingerprint / IPFS CID hash (`submittedReports: Set<Bytes<32>>`)
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc
- Global submission counter (`reportCount: Counter`)
- Midnight blockchain transaction and ZK verification state

<<<<<<< HEAD
### Private (Never On-Chain)
- Whistleblower personal identity (name, email, employee ID, department, IP address)
=======
### Private

- Employee identity (name, email, employee ID, department)
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc
- Corporate authorization secret and private credentials
- Plaintext misconduct description and narrative
- Attached PDF documents, photos, and evidence files
- Private Compact witness inputs

<<<<<<< HEAD
### Proved Without Revealing
Through Zero-Knowledge circuit execution, the whistleblower proves to the Midnight blockchain that:
1. **They are an authorized corporate employee** possessing a valid credential.
2. **The report fingerprint is fresh and unique** (has not been previously submitted).
3. **Zero Identity Exposure**: The proof succeeds without disclosing who the submitter is or revealing the secret credential to anyone.
=======
### What the User Proves

Through Zero-Knowledge circuit execution, the whistleblower proves:

1. **Insider Authorization**: The submitter possesses an authorized corporate credential/secret.
2. **Integrity & Freshness**: The 32-byte report fingerprint conforms to submission rules and has not been submitted previously (duplicate prevention).
3. **Zero Identity Leakage**: No trace of the submitter's identity or private credential is ever stored on-chain or leaked through public transactions.
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc

---

## Tiny On-Chain Footprint

<<<<<<< HEAD
Veritas Gate enforces an ultra-lightweight hybrid on-chain/off-chain architecture:
- **Heavy Media Off-Chain**: Full report text, PDF files, and multimedia evidence are encrypted client-side and stored in decentralized off-chain storage (IPFS/Arweave).
- **Minimal On-Chain State**: Midnight stores only a 32-byte cryptographic hash (`Bytes<32>`) and verification counter on-chain.
- **Zero-Knowledge Verification**: The Midnight Impact VM verifies the validity of the submission with minimal ledger storage and negligible gas consumption.

---

## Privacy Claim

### What an On-Chain Observer CAN Learn:
- That a valid, authorized report fingerprint was submitted at a specific block height.
- The 32-byte SHA-256 fingerprint and IPFS CID of the encrypted payload.
- The incremented total count of recorded whistleblower reports on the contract.

### What an On-Chain Observer CANNOT Learn:
- The identity, name, department, or email of the whistleblower.
- The corporate authorization secret or private key used to prove insider status.
- The contents of the report, incident category, or attached PDF evidence files.
- The relationship between the wallet paying gas and the whistleblower's real-world identity.

*Note: True operational privacy also depends on user hygiene (e.g. accessing the portal via VPN/Tor to prevent network-level ISP correlation and ensuring evidence documents do not contain embedded EXIF/author metadata).*
=======
Veritas Gate follows a lightweight, off-chain data design pattern:

- **Heavy Media Off-Chain**: Full report text, PDF documents, and multimedia evidence files are encrypted client-side and stored in decentralized off-chain storage (IPFS/Arweave).
- **Minimal On-Chain Storage**: Midnight stores only the 32-byte cryptographic fingerprint (`Bytes<32>`) and verification counter on-chain.
- **Zero-Knowledge Efficiency**: Midnight verifies the proof and updates state with minimal ledger overhead, preserving scalability and throughput.
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc

---

## Tech Stack

- **Midnight Network**: Data-protection blockchain for Zero-Knowledge smart contracts.
- **Compact**: Smart contract programming language for Midnight.
- **Midnight.js**: SDK for contract interaction and runtime bindings.
- **React 18 + Vite**: High-performance frontend with TypeScript.
- **Midnight Lace Wallet**: Web3 browser extension connector.
- **Web Crypto API**: Native browser AES-256-GCM authenticated encryption.
- **IPFS**: Decentralized off-chain encrypted document storage.
- **Node.js**: v22 LTS runtime.
- **Docker**: Local Midnight Proof Server container (`midnightnetwork/proof-server:latest`).
- **Vitest**: Unit & integration test runner.

---

## Prerequisites

- **Node.js**: v22 or higher (`node -v`)
- **Docker Desktop**: Running locally (`docker ps`)
- **Compact Compiler**: `compactc` v0.31.1 (`~/.compact/bin/compactc`)
- **Midnight Lace Wallet**: Browser extension configured for **Preprod Network**

---

## Run Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/SarthakKshirsagar01/VeritasGate.git
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

5. **Run automated tests:**
   ```bash
   npm test
   ```

6. **Start the local development frontend:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

7. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deploy Frontend

### Netlify Deployment:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Live URL**: [https://veritasgate.netlify.app](https://veritasgate.netlify.app)

### Vercel Deployment:
- **Build command**: `npm run build`
- **Output directory**: `dist`

---

## Demo Video

<<<<<<< HEAD
[PLACEHOLDER — ADD YOUR 2-MINUTE RECORDED DEMO VIDEO LINK HERE]
=======
Deploy to the Midnight **Preview** or **Preprod** network:

```bash
npm run deploy:preview
```

_Note: For live testnet transaction signing, set your funded wallet seed phrase in your environment:_

```bash
MIDNIGHT_WALLET_SEED="your twelve or twenty-four word seed phrase" npm run deploy:preview
```
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc

---

## Initial Idea

<<<<<<< HEAD
Veritas Gate is a privacy-preserving corporate whistleblower reporting portal on the Midnight blockchain. It enables verified employees to submit encrypted misconduct reports and cryptographic fingerprints off-chain and on-chain without revealing their identity, employee ID, department, or sensitive report contents.
=======
Veritas Gate is a privacy-preserving corporate whistleblower reporting portal on the Midnight blockchain. It enables verified employees to submit encrypted misconduct reports and cryptographic fingerprints off chain and on-chain without revealing their identity, employee ID, department, or sensitive report contents.
>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc

---

## Screenshots

### Contract Compilation
<<<<<<< HEAD
![Successful Contract Compilation](screenshots/compile-success.png)

### Contract Deployment
=======

![Successful Contract Compilation](screenshots/compile-success.png)

### Contract Deployment

>>>>>>> ce33ca0d35d5bf9a89b8ee1883580b786e6602cc
![Successful Contract Deployment](screenshots/deployment-success.png)
