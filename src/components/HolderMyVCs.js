import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getCredentials, storeCredential, deleteCredential as deleteFromDB } from "../utils/indexedDB";
import "../styles/animations.css";

export default function HolderMyVCs() {
  const { userAddress, did } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cidInput, setCidInput] = useState("");
  const [addingVC, setAddingVC] = useState(false);

  useEffect(() => {
    if (userAddress) {
      fetchCredentials();
      fetchStats();
    }
  }, [userAddress]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching credentials for:", userAddress);
      
      // Fetch from IndexedDB (local browser storage)
      const localCreds = await getCredentials(userAddress);
      console.log(`Found ${localCreds.length} credentials in IndexedDB`);
      
      // Also fetch from backend
      try {
        const response = await axios.get(
          `http://localhost:5000/holder/vcs/${userAddress}`
        );

        if (response.data.success && response.data.vcs) {
          // Merge backend and local credentials
          const backendCreds = response.data.vcs;
          
          // Store backend credentials in IndexedDB
          for (const cred of backendCreds) {
            if (!localCreds.find(c => c.vcCID === cred.vcCID)) {
              await storeCredential({
                cid: cred.vcCID,
                vc: cred.fullVC || cred,
                holderAddress: userAddress.toLowerCase(),
                issuerDID: cred.issuerDID,
                issuanceDate: cred.issuanceDate,
                credentialType: cred.credentialType,
                credentialSubject: cred.credentialSubject,
                receivedAt: cred.receivedAt || new Date().toISOString()
              });
            }
          }
        }
      } catch (backendErr) {
        console.warn("Backend fetch failed, using local data only:", backendErr.message);
      }
      
      // Reload from IndexedDB to get merged data
      const allCreds = await getCredentials(userAddress);
      setCredentials(allCreds);
      
    } catch (err) {
      console.error("Error fetching credentials:", err);
      setError(err.message || "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/holder/stats/${userAddress}`
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleViewCredential = (cid) => {
    navigate(`/view-credential/${cid}`);
  };

  const handleGenerateProof = (vc) => {
    // Navigate to selective disclosure page
    navigate(`/disclose/${vc.cid || vc.vcCID}`);
  };

  const handleAddFromCID = async () => {
    if (!cidInput.trim()) {
      alert("Please enter a valid IPFS CID");
      return;
    }

    try {
      setAddingVC(true);
      setError(null);

      console.log("Fetching VC from IPFS:", cidInput);

      // Fetch VC from IPFS
      const response = await axios.get(`http://localhost:5000/fetchVC/${cidInput.trim()}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch VC");
      }

      const vcData = response.data.vc;

      // Store in IndexedDB
      await storeCredential({
        cid: cidInput.trim(),
        vc: vcData,
        holderAddress: userAddress.toLowerCase(),
        issuerDID: vcData.issuer?.id,
        issuanceDate: vcData.issuanceDate,
        credentialType: vcData.type?.[1] || "VerifiableCredential",
        credentialSubject: vcData.credentialSubject,
        receivedAt: new Date().toISOString()
      });

      console.log("✅ VC added to IndexedDB");

      // Close modal and refresh
      setShowAddModal(false);
      setCidInput("");
      await fetchCredentials();

      alert("Credential added successfully!");

    } catch (err) {
      console.error("Error adding VC:", err);
      alert(err.response?.data?.message || err.message || "Failed to add credential");
    } finally {
      setAddingVC(false);
    }
  };

  const handleRemoveCredential = async (cid) => {
    if (!window.confirm("Remove this credential from your dashboard? (It will still exist on IPFS and blockchain)")) {
      return;
    }

    try {
      console.log(`🗑️ Removing credential: ${cid}`);
      
      // Remove from backend first
      try {
        const response = await axios.delete(`http://localhost:5000/holder/vc/${cid}`, {
          data: { address: userAddress }
        });
        console.log("✅ Backend removal successful:", response.data);
      } catch (backendErr) {
        console.warn("⚠️ Backend removal failed:", backendErr.message);
        // Continue anyway - remove from local storage
      }

      // Remove from IndexedDB
      try {
        await deleteFromDB(cid);
        console.log("✅ IndexedDB removal successful");
      } catch (dbErr) {
        console.warn("⚠️ IndexedDB removal failed:", dbErr.message);
      }

      // Update local state immediately
      setCredentials(prevCreds => prevCreds.filter(cred => cred.vcCID !== cid));
      
      // Refresh credentials list from backend
      await fetchCredentials();
      
      alert("✅ Credential removed from dashboard");
    } catch (err) {
      console.error("❌ Error removing credential:", err);
      alert("Failed to remove credential: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const getCredentialIcon = (type) => {
    const icons = {
      "StudentID": "🎓",
      "Certificate": "📜",
      "License": "🪪",
      "Diploma": "📄",
      "Badge": "🏅",
      "default": "🆔"
    };
    return icons[type] || icons.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📜 My Credentials
              </h1>
              <p className="text-gray-600">View and manage credentials you've received</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Return to portal selection? You will be logged out.")) {
                  localStorage.clear();
                  navigate("/");
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 hover:shadow-lg"
            >
              ← Back to Home
            </button>
          </div>

        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Credentials</p>
                  <p className="text-4xl font-bold">{stats.totalCredentials}</p>
                </div>
                <div className="text-5xl opacity-50">📚</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Verified</p>
                  <p className="text-4xl font-bold">{stats.totalCredentials}</p>
                </div>
                <div className="text-5xl opacity-50">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Latest Issue</p>
                  <p className="text-sm font-semibold">
                    {stats.latestIssuance 
                      ? formatDate(stats.latestIssuance).split(",")[0]
                      : "N/A"}
                  </p>
                </div>
                <div className="text-5xl opacity-50">📅</div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Credentials</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                <span>➕</span> Add from CID
              </button>
              <button
                onClick={fetchCredentials}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    🔄 Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && credentials.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your credentials...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
              <p className="text-red-700 text-lg mb-2">❌ {error}</p>
              <button
                onClick={fetchCredentials}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && credentials.length === 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-white border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center shadow-lg">
              <div className="text-6xl mb-4 animate-bounce">📭</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No Credentials Received Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven't received any verifiable credentials from issuers yet. 
                Credentials issued to your wallet address will appear here automatically.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                💡 Tip: Credentials will appear here once an issuer creates one for your wallet address.
              </p>
            </div>
          )}

          {/* Credentials Grid */}
          {!loading && !error && credentials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {credentials.map((vc, index) => {
                const subject = vc.vc?.credentialSubject || vc.credentialSubject || {};
                const vcCID = vc.cid || vc.vcCID;
                const documentType = subject.documentType || vc.documentType || "Credential";
                
                return (
                <div
                  key={vcCID || index}
                  className="credential-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-indigo-300 transform hover:-translate-y-2"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {getCredentialIcon(documentType)}
                        </span>
                        <div>
                          <h3 className="font-bold text-lg">
                            {documentType}
                          </h3>
                          <p className="text-sm text-indigo-100">
                            {vc.credentialType || "VerifiableCredential"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="font-semibold text-gray-800">{subject.name || "N/A"}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                        <p className="font-mono text-sm text-gray-700">{subject.rollNumber || "N/A"}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="text-sm text-gray-700">{subject.department || "N/A"}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Issued Date</p>
                        <p className="text-sm text-gray-700">{formatDate(vc.issuanceDate)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Issuer DID</p>
                        <p className="font-mono text-xs text-gray-600 break-all">
                          {vc.issuerDID ? vc.issuerDID.substring(0, 30) + "..." : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">IPFS CID</p>
                        <p className="font-mono text-xs text-gray-600 break-all">
                          {vcCID ? vcCID.substring(0, 20) + "..." : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewCredential(vcCID)}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <span>👁️</span> View Credential
                      </button>

                      <button
                        onClick={() => handleGenerateProof(vc)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <span>🔐</span> Selective Disclosure
                      </button>

                      <button
                        onClick={() => handleRemoveCredential(vcCID)}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                      >
                        <span>🗑️</span> Remove
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-md">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
            <span>ℹ️</span> About Your Credential Dashboard
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Receive:</strong> Credentials issued to your wallet appear here automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Add from CID:</strong> Import credentials from IPFS using their CID</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>View:</strong> Access full credential details including issuer info and digital signatures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Selective Disclosure:</strong> Share only specific attributes without revealing everything</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Privacy:</strong> BBS+ signatures enable zero-knowledge proofs for enhanced privacy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Decentralized:</strong> All credentials stored locally and on IPFS</span>
            </li>
          </ul>
        </div>

        {/* Add from CID Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span>➕</span> Add Credential from IPFS
                </h2>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Enter the IPFS CID of the credential you want to add to your dashboard:
                </p>

                <input
                  type="text"
                  value={cidInput}
                  onChange={(e) => setCidInput(e.target.value)}
                  placeholder="Qm... or bafy..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm mb-4"
                  disabled={addingVC}
                />

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> You can get the CID from the issuer or from a QR code scan.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddFromCID}
                    disabled={addingVC || !cidInput.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addingVC ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <span>✓</span> Add Credential
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setCidInput("");
                    }}
                    disabled={addingVC}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
