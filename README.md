# MyDID — Decentralized Identity Management System

Blockchain-based decentralized identity (DID) platform that lets users create, manage, and verify digital identities **without relying on centralized authorities** — tamper-proof, user-owned credential verification on Ethereum.

## ✨ Key Features

- **Self-sovereign identity** — users own and control their credentials; no central authority
- **MetaMask wallet authentication** — all transaction signing happens in the browser; private keys never touch the backend
- **Ethereum smart contracts (Sepolia)** — on-chain DID registration and verification with Solidity
- **IPFS document storage** — decentralized, content-addressed storage for identity documents
- **Selective disclosure** — share only the credentials a verifier needs
- **Dockerized services** — one-command startup for the full stack

## 🏗️ Architecture

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  React.js UI │────▶│ Node.js / Express │────▶│ Ethereum (Sepolia)│
│  + MetaMask  │     │     REST API      │     │  Smart Contracts  │
└──────────────┘     └─────────┬─────────┘     └──────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │    IPFS     │
                        │ Doc Storage │
                        └─────────────┘
```

**Stack:** Ethereum (Sepolia) · Solidity · React.js · Ethers.js · Node.js · Express.js · IPFS · Docker · Tailwind CSS

## 🐳 Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose
- MetaMask browser extension

```bash
# 1. Navigate to the project root
cd "did app/mydid"

# 2. Set up environment (see src/backend/.env.example)
cp src/backend/.env.example src/backend/.env

# 3. Build and run
docker-compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

## 🔒 Security Model

This setup **never stores or accesses MetaMask private keys**. All blockchain transaction signing happens strictly in the browser via the MetaMask extension. The backend handles only public data verification and IPFS storage.

## 🧪 Local Development (without Docker)

```bash
# Frontend
npm install
npm start          # http://localhost:3000

# Backend
cd src/backend
npm install
npm run dev        # http://localhost:5000
```

## 👥 Team Project

Built as a team project (2024–2025). My contributions: Ethereum smart-contract integration, wallet authentication and DID resolution workflows, responsive React + Tailwind frontend, IPFS credential handling, and Docker containerization.

---

**Author:** [Parthiv A M](https://github.com/Paaarthiv) · [LinkedIn](https://www.linkedin.com/in/parthivam)
