// utils/blockchain.js - Ethereum blockchain integration for VC registry
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider = null;
let vcContract = null;

/**
 * Initialize blockchain connection to Sepolia testnet
 */
async function initializeBlockchain() {
  try {
    // Setup provider (Infura or Alchemy)
    const infuraKey = process.env.INFURA_API_KEY;
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    
    if (infuraKey) {
      provider = new ethers.InfuraProvider("sepolia", infuraKey);
      console.log("✅ Connected to Sepolia via Infura");
    } else if (alchemyKey) {
      provider = new ethers.AlchemyProvider("sepolia", alchemyKey);
      console.log("✅ Connected to Sepolia via Alchemy");
    } else {
      throw new Error("No RPC provider configured (INFURA_API_KEY or ALCHEMY_API_KEY)");
    }



    // Load contract
    const contractAddress = process.env.VC_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === "your_contract_address_here") {
      console.warn("⚠️ Valid VC_CONTRACT_ADDRESS not set - blockchain features disabled");
      return;
    }

    // Try to load ABI from artifacts
    const abiPath = path.join(__dirname, "../artifacts/contracts/VCRegistry.sol/VCRegistry.json");
    let abi;

    if (fs.existsSync(abiPath)) {
      const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      abi = artifact.abi;
      console.log("✅ Loaded contract ABI from artifacts");
    } else {
      // Fallback minimal ABI if artifacts not found
      console.warn("⚠️ Contract artifacts not found, using minimal ABI");
      abi = [
        "function storeVC(string memory documentHash, string memory ipfsCID) public returns (uint256)",
        "function verifyVC(string memory documentHash) public view returns (bool exists, string memory ipfsCID, address issuer, uint256 timestamp, bool revoked)",
        "function revokeVC(string memory documentHash) public",
        "event VCStored(uint256 indexed vcId, string documentHash, string ipfsCID, address indexed issuer, uint256 timestamp)",
        "event VCRevoked(string documentHash, address indexed revoker, uint256 timestamp)"
      ];
    }

    vcContract = new ethers.Contract(contractAddress, abi, provider);
    console.log(`✅ Read-only VC Registry contract loaded at: ${contractAddress}`);

  } catch (error) {
    console.error("❌ Blockchain initialization error:", error.message);
    throw error;
  }
}

/**
 * Store VC metadata on blockchain
 * Note: This should now be handled by the frontend via MetaMask!
 */
async function storeVCOnChain(documentHash, ipfsCID) {
  throw new Error("Backend should not store VCs on chain. Use MetaMask on frontend.");
}

/**
 * Verify VC from blockchain
 * @param {string} documentHash - SHA-256 hash to verify
 * @returns {Promise<{exists: boolean, ipfsCID: string, issuer: string, timestamp: number, revoked: boolean}>}
 */
async function verifyVCOnChain(documentHash) {
  try {
    if (!vcContract) {
      throw new Error("VC contract not initialized");
    }

    console.log(`🔍 Verifying VC on blockchain: ${documentHash}`);

    const result = await vcContract.verifyVC(documentHash);
    
    const verification = {
      exists: result.exists,
      ipfsCID: result.ipfsCID,
      issuer: result.issuer,
      timestamp: Number(result.timestamp),
      revoked: result.revoked
    };

    console.log(`✅ Verification result:`, verification);
    return verification;

  } catch (error) {
    console.error("❌ Error verifying VC on blockchain:", error);
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
}

/**
 * Revoke VC on blockchain
 * Note: This should now be handled by the frontend via MetaMask!
 */
async function revokeVCOnChain(documentHash) {
  throw new Error("Backend should not revoke VCs on chain. Use MetaMask on frontend.");
}

/**
 * Get wallet balance
 * @returns {Promise<string>}
 */
async function getWalletBalance() {
  return "N/A (Read-only)";
}

function isBlockchainReady() {
  return !!(provider && vcContract);
}

module.exports = {
  initializeBlockchain,
  storeVCOnChain,
  verifyVCOnChain,
  revokeVCOnChain,
  getWalletBalance,
  isBlockchainReady
};
