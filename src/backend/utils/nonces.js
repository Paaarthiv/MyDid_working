/**
 * Nonce Management Utilities
 * Handles cryptographic nonce generation, storage, and verification
 * for DID ownership proof via challenge-response using SQLite
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// File paths
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'challenge.sqlite');
const OLD_NONCES_FILE = path.join(DATA_DIR, 'nonces.json');
const OLD_PENDING_FILE = path.join(DATA_DIR, 'pendingRequests.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('❌ Error opening challenge database:', err.message);
  } else {
    db.serialize(() => {
      // Enable Foreign Keys and WAL mode for better concurrency
      db.run('PRAGMA foreign_keys = ON');
      db.run('PRAGMA journal_mode = WAL');

      // Create pendingRequests table
      db.run(`CREATE TABLE IF NOT EXISTS pending_requests (
        requestId TEXT PRIMARY KEY,
        holderDID TEXT,
        holderAddress TEXT,
        holderName TEXT,
        vcType TEXT,
        verificationID TEXT,
        message TEXT,
        status TEXT,
        createdAt TEXT,
        nonceId TEXT,
        verifiedAt TEXT,
        signature TEXT,
        recoveredAddress TEXT,
        attachedStudentVC TEXT,
        issuedVCCID TEXT,
        approvedBy TEXT,
        approvedAt TEXT,
        rejectionReason TEXT,
        rejectedBy TEXT,
        rejectedAt TEXT,
        updatedAt TEXT
      )`);

      // Create nonces table
      db.run(`CREATE TABLE IF NOT EXISTS nonces (
        nonceId TEXT PRIMARY KEY,
        nonce TEXT,
        requestId TEXT,
        holderDID TEXT,
        messageToSign TEXT,
        expiresAt TEXT,
        used INTEGER DEFAULT 0,
        createdAt TEXT,
        usedAt TEXT,
        signature TEXT,
        FOREIGN KEY (requestId) REFERENCES pending_requests(requestId) ON DELETE CASCADE
      )`, () => {
        // Run migration only after tables are created
        migrateOldData();
      });
    });
  }
});

// Promise wrappers for SQLite
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// Helper to parse JSON from DB
const parseRequestRow = (row) => {
  if (!row) return null;
  const parsed = { ...row };
  if (parsed.attachedStudentVC) {
    try {
      parsed.attachedStudentVC = JSON.parse(parsed.attachedStudentVC);
    } catch (e) {
      parsed.attachedStudentVC = null;
    }
  }
  return parsed;
};

// Migrate old JSON data
async function migrateOldData() {
  try {
    const { count } = await dbGet('SELECT COUNT(*) as count FROM pending_requests');
    if (count === 0 && fs.existsSync(OLD_PENDING_FILE)) {
      console.log('🔄 Migrating pendingRequests.json to SQLite...');
      const pendingData = JSON.parse(fs.readFileSync(OLD_PENDING_FILE, 'utf8'));
      
      const insertReq = db.prepare(`INSERT INTO pending_requests 
        (requestId, holderDID, holderAddress, holderName, vcType, verificationID, message, status, createdAt, nonceId, verifiedAt, signature, recoveredAddress, attachedStudentVC, issuedVCCID, approvedBy, approvedAt, rejectionReason, rejectedBy, rejectedAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      for (const [id, req] of Object.entries(pendingData)) {
        insertReq.run(
          id, req.holderDID, req.holderAddress, req.holderName, req.vcType, req.verificationID, req.message, req.status, req.createdAt, req.nonceId, req.verifiedAt, req.signature, req.recoveredAddress, 
          req.attachedStudentVC ? JSON.stringify(req.attachedStudentVC) : null,
          req.issuedVCCID, req.approvedBy, req.approvedAt, req.rejectionReason, req.rejectedBy, req.rejectedAt, req.updatedAt
        );
      }
      insertReq.finalize();
      console.log('✅ Migrated pending requests');
    }

    const { count: nonceCount } = await dbGet('SELECT COUNT(*) as count FROM nonces');
    if (nonceCount === 0 && fs.existsSync(OLD_NONCES_FILE)) {
      console.log('🔄 Migrating nonces.json to SQLite...');
      const noncesData = JSON.parse(fs.readFileSync(OLD_NONCES_FILE, 'utf8'));
      
      const insertNonce = db.prepare(`INSERT INTO nonces 
        (nonceId, nonce, requestId, holderDID, messageToSign, expiresAt, used, createdAt, usedAt, signature) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      for (const [id, n] of Object.entries(noncesData)) {
        insertNonce.run(
          id, n.nonce, n.requestId, n.holderDID, n.messageToSign, n.expiresAt, n.used ? 1 : 0, n.createdAt, n.usedAt, n.signature
        );
      }
      insertNonce.finalize();
      console.log('✅ Migrated nonces');
    }
  } catch (err) {
    console.error('❌ Error migrating JSON to SQLite:', err);
  }
}

// Generate cryptographically secure random nonce
function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Create a new pending request
async function createPendingRequest(holderDID, holderAddress, holderName, vcType, verificationID, message, attachedStudentVC) {
  const requestId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await dbRun(`INSERT INTO pending_requests 
    (requestId, holderDID, holderAddress, holderName, vcType, verificationID, message, status, createdAt, attachedStudentVC)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [requestId, holderDID, holderAddress, holderName || 'Unknown', vcType, verificationID, message || '', 'pending', createdAt, attachedStudentVC ? JSON.stringify(attachedStudentVC) : null]
  );
  
  console.log(`✅ Created pending request: ${requestId}`);
  return requestId;
}

// Create a challenge nonce for a request
async function createChallenge(requestId) {
  const request = await getPendingRequest(requestId);
  
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

  const nonceId = crypto.randomUUID();
  const nonce = generateNonce(32);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Create message to sign
  const messageToSign = `DigiLocker DID Ownership Proof\n\nNonce: ${nonce}\nRequest ID: ${requestId}\nAction: Prove DID Ownership\nExpires: ${expiresAt}\n\nSign this message to verify you own: ${request.holderDID}`;

  await dbRun(`INSERT INTO nonces 
    (nonceId, nonce, requestId, holderDID, messageToSign, expiresAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nonceId, nonce, requestId, request.holderDID, messageToSign, expiresAt, new Date().toISOString()]
  );

  // Link nonce to request
  await dbRun(`UPDATE pending_requests SET nonceId = ? WHERE requestId = ?`, [nonceId, requestId]);

  console.log(`✅ Created challenge nonce: ${nonceId} for request: ${requestId}`);
  return { nonceId, nonce, messageToSign, expiresAt };
}

// Verify a challenge response
async function verifyChallenge(requestId, nonceId, signature, recoveredAddress) {
  const request = await getPendingRequest(requestId);
  const nonceData = await dbGet(`SELECT * FROM nonces WHERE nonceId = ?`, [nonceId]);

  if (!nonceData) throw new Error('Nonce not found');
  if (!request) throw new Error('Request not found');
  if (nonceData.requestId !== requestId) throw new Error('Nonce does not match request');
  if (new Date() > new Date(nonceData.expiresAt)) throw new Error('Nonce has expired');
  if (nonceData.used) throw new Error('Nonce has already been used');

  const didAddress = request.holderDID.split(':')[2];
  if (!didAddress) throw new Error('Invalid DID format');
  if (recoveredAddress.toLowerCase() !== didAddress.toLowerCase()) throw new Error('Signature does not match DID owner');

  // Transaction-like update
  const now = new Date().toISOString();
  await dbRun(`UPDATE nonces SET used = 1, usedAt = ?, signature = ? WHERE nonceId = ?`, [now, signature, nonceId]);
  await dbRun(`UPDATE pending_requests SET status = 'verified', verifiedAt = ?, signature = ?, recoveredAddress = ? WHERE requestId = ?`, 
    [now, signature, recoveredAddress, requestId]
  );

  console.log(`✅ Challenge verified for request: ${requestId}`);
  return true;
}

// Get pending request by ID
async function getPendingRequest(requestId) {
  const row = await dbGet(`SELECT * FROM pending_requests WHERE requestId = ?`, [requestId]);
  return parseRequestRow(row);
}

// Get all pending requests
async function getAllPendingRequests() {
  const rows = await dbAll(`SELECT * FROM pending_requests ORDER BY createdAt DESC`);
  return rows.map(parseRequestRow);
}

// Get verified requests only
async function getVerifiedRequests() {
  const rows = await dbAll(`SELECT * FROM pending_requests WHERE status = 'verified' ORDER BY createdAt DESC`);
  return rows.map(parseRequestRow);
}

// Get requests by holder address
async function getRequestsByHolder(holderAddress) {
  const rows = await dbAll(`SELECT * FROM pending_requests WHERE holderAddress = ? ORDER BY createdAt DESC`, [holderAddress]);
  return rows.map(parseRequestRow);
}

// Update request status (for approval/rejection by issuer)
async function updateRequestStatus(requestId, status, additionalData = {}) {
  const request = await getPendingRequest(requestId);
  if (!request) throw new Error('Request not found');

  let query = `UPDATE pending_requests SET status = ?, updatedAt = ?`;
  let params = [status, new Date().toISOString()];

  const updatableFields = [
    'issuedVCCID', 'approvedBy', 'approvedAt', 
    'rejectionReason', 'rejectedBy', 'rejectedAt'
  ];

  for (const field of updatableFields) {
    if (additionalData[field] !== undefined) {
      query += `, ${field} = ?`;
      params.push(additionalData[field]);
    }
  }

  query += ` WHERE requestId = ?`;
  params.push(requestId);

  await dbRun(query, params);
  return await getPendingRequest(requestId);
}

// Cleanup expired nonces (run periodically)
async function cleanupExpiredNonces() {
  const now = new Date().toISOString();
  const result = await dbRun(`DELETE FROM nonces WHERE expiresAt < ?`, [now]);
  if (result.changes > 0) {
    console.log(`🧹 Cleaned up ${result.changes} expired nonces`);
  }
  return result.changes;
}

/**
 * Delete a pending request
 */
async function deletePendingRequest(requestId) {
  try {
    const result = await dbRun(`DELETE FROM pending_requests WHERE requestId = ?`, [requestId]);
    if (result.changes === 0) {
      console.log(`⚠️ Request ${requestId} not found`);
      return { success: false, message: 'Request not found' };
    }
    console.log(`✅ Request ${requestId} deleted successfully`);
    return { success: true, message: 'Request deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting request:', error);
    return { success: false, message: error.message };
  }
}

// Get raw nonce by ID
async function getNonceData(nonceId) {
  return await dbGet(`SELECT * FROM nonces WHERE nonceId = ?`, [nonceId]);
}

// Cleanup expired nonces every 10 minutes
setInterval(cleanupExpiredNonces, 10 * 60 * 1000);

module.exports = {
  createPendingRequest,
  createChallenge,
  verifyChallenge,
  getPendingRequest,
  getAllPendingRequests,
  getVerifiedRequests,
  getRequestsByHolder,
  updateRequestStatus,
  cleanupExpiredNonces,
  generateNonce,
  deletePendingRequest,
  getNonceData
};
