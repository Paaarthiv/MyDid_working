// utils/ipfs.js - IPFS integration using direct Pinata HTTP APIs
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const PINATA_API_BASE_URL = "https://api.pinata.cloud";
const DEFAULT_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs";

let pinataClient = null;

function getPinataHeaders() {
  const jwt = process.env.PINATA_JWT;
  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }

  const apiKey = process.env.PINATA_API_KEY;
  const secretApiKey = process.env.PINATA_SECRET_API_KEY;
  if (!apiKey || !secretApiKey) {
    throw new Error("Pinata credentials not configured. Set PINATA_JWT or PINATA_API_KEY and PINATA_SECRET_API_KEY.");
  }

  return {
    pinata_api_key: apiKey,
    pinata_secret_api_key: secretApiKey
  };
}

function getIpfsUrl(cid) {
  const gateway = (process.env.IPFS_GATEWAY_URL || DEFAULT_GATEWAY_URL).replace(/\/$/, "");
  return `${gateway}/${cid}`;
}

/**
 * Initialize Pinata HTTP client.
 */
function initializePinata() {
  pinataClient = axios.create({
    baseURL: PINATA_API_BASE_URL,
    timeout: 30000,
    maxContentLength: 100 * 1024 * 1024,
    maxBodyLength: 100 * 1024 * 1024,
    headers: getPinataHeaders()
  });
  console.log("Pinata IPFS HTTP client initialized");
}

function requirePinata() {
  if (!pinataClient) {
    initializePinata();
  }
  return pinataClient;
}

/**
 * Test Pinata authentication.
 * @returns {Promise<boolean>}
 */
async function testPinataConnection() {
  try {
    await requirePinata().get("/data/testAuthentication");
    console.log("Pinata authentication successful");
    return true;
  } catch (error) {
    console.error("Pinata authentication failed:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Upload file to IPFS via Pinata.
 * @param {string} filePath - Path to file
 * @param {string} fileName - Original filename
 * @returns {Promise<{cid: string, ipfsUrl: string}>}
 */
async function uploadFileToPinata(filePath, fileName) {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: fileName || "document"
    });
    form.append("pinataMetadata", JSON.stringify({
      name: fileName || "document",
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        type: "document"
      }
    }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

    const response = await requirePinata().post("/pinning/pinFileToIPFS", form, {
      headers: {
        ...getPinataHeaders(),
        ...form.getHeaders()
      }
    });

    const cid = response.data.IpfsHash;
    const ipfsUrl = getIpfsUrl(cid);

    console.log(`File uploaded to IPFS: ${cid}`);
    return { cid, ipfsUrl };
  } catch (error) {
    console.error("Error uploading file to Pinata:", error.response?.data || error.message);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Upload JSON data to IPFS via Pinata.
 * @param {Object} jsonData - JSON object to upload
 * @param {string} name - Name for the pinned JSON
 * @returns {Promise<{cid: string, ipfsUrl: string}>}
 */
async function uploadJSONToPinata(jsonData, name) {
  try {
    const payload = {
      pinataContent: jsonData,
      pinataMetadata: {
        name,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: "vc-json"
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const response = await requirePinata().post("/pinning/pinJSONToIPFS", payload);
    const cid = response.data.IpfsHash;
    const ipfsUrl = getIpfsUrl(cid);

    console.log(`JSON uploaded to IPFS: ${cid}`);
    return { cid, ipfsUrl };
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error.response?.data || error.message);
    throw new Error("Failed to upload JSON to IPFS");
  }
}

/**
 * Retrieve JSON from IPFS.
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>}
 */
async function retrieveJSONFromIPFS(cid) {
  try {
    const response = await axios.get(getIpfsUrl(cid), {
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024
    });
    console.log(`Retrieved JSON from IPFS: ${cid}`);
    return response.data;
  } catch (error) {
    console.error("Error retrieving JSON from IPFS:", error.response?.data || error.message);
    const status = error.response?.status;
    const ipfsError = new Error(
      status === 400
        ? "Invalid IPFS CID or gateway request"
        : status === 404
        ? "IPFS content not found"
        : "Failed to retrieve JSON from IPFS"
    );
    ipfsError.statusCode = status === 400 || status === 404 ? status : 502;
    throw ipfsError;
  }
}

/**
 * Unpin content from IPFS.
 * @param {string} cid - IPFS CID to unpin
 * @returns {Promise<boolean>}
 */
async function unpinFromIPFS(cid) {
  try {
    await requirePinata().delete(`/pinning/unpin/${encodeURIComponent(cid)}`);
    console.log(`Unpinned from IPFS: ${cid}`);
    return true;
  } catch (error) {
    console.error("Error unpinning from IPFS:", error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  initializePinata,
  testPinataConnection,
  uploadFileToPinata,
  uploadJSONToPinata,
  retrieveJSONFromIPFS,
  unpinFromIPFS
};
