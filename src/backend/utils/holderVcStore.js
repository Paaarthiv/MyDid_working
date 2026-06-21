const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const HOLDER_VCS_FILE = path.join(DATA_DIR, "holder-vcs.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HOLDER_VCS_FILE)) {
    fs.writeFileSync(HOLDER_VCS_FILE, JSON.stringify({}, null, 2));
  }
}

function loadAllHolderVCs() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(HOLDER_VCS_FILE, "utf8"));
  } catch (error) {
    console.error("Error loading holder VCs:", error);
    return {};
  }
}

function saveAllHolderVCs(data) {
  ensureDataFile();
  fs.writeFileSync(HOLDER_VCS_FILE, JSON.stringify(data, null, 2));
}

function loadVCsForHolder(address) {
  const data = loadAllHolderVCs();
  return data[String(address).toLowerCase()] || [];
}

function saveVCsForHolder(address, vcs) {
  const data = loadAllHolderVCs();
  data[String(address).toLowerCase()] = vcs;
  saveAllHolderVCs(data);
}

function storeVCReference(holderAddress, vcRef) {
  const existingVCs = loadVCsForHolder(holderAddress);
  if (existingVCs.some(vc => vc.vcCID === vcRef.vcCID)) {
    return { inserted: false, totalVCs: existingVCs.length };
  }

  existingVCs.push({
    ...vcRef,
    receivedAt: vcRef.receivedAt || new Date().toISOString()
  });
  saveVCsForHolder(holderAddress, existingVCs);
  return { inserted: true, totalVCs: existingVCs.length };
}

function removeVCReference(holderAddress, cid) {
  const existingVCs = loadVCsForHolder(holderAddress);
  const nextVCs = existingVCs.filter(vc => vc.vcCID !== cid);
  if (nextVCs.length === existingVCs.length) {
    return { removed: false, totalVCs: existingVCs.length };
  }
  saveVCsForHolder(holderAddress, nextVCs);
  return { removed: true, totalVCs: nextVCs.length };
}

module.exports = {
  loadVCsForHolder,
  saveVCsForHolder,
  storeVCReference,
  removeVCReference
};
