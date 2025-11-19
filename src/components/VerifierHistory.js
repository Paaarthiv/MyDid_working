import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletCard from "./wallet/WalletCard";
import CardDetailsDrawer from "./wallet/CardDetailsDrawer";
import { 
  listVerifierHistory, 
  deleteHistoryItem, 
  clearVerifierHistory 
} from "../utils/walletStorage";
import "../styles/walletTheme.css";

export default function VerifierHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const userAddress = localStorage.getItem("userAddress") || "anonymous";
    const items = listVerifierHistory(userAddress);
    setHistory(items);
    console.log(`📋 Loaded ${items.length} verification history items`);
  };

  const handleDelete = (id, e) => {
    // Prevent event propagation if event exists
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (window.confirm("Remove this verification from history?\n\nThis only removes it from your local view. The credential on blockchain/IPFS is not affected.")) {
      const userAddress = localStorage.getItem("userAddress") || "anonymous";
      deleteHistoryItem(id, userAddress);
      loadHistory();
      console.log(`🗑️ Deleted history item: ${id}`);
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    const userAddress = localStorage.getItem("userAddress") || "anonymous";
    clearVerifierHistory(userAddress);
    loadHistory();
    setShowClearConfirm(false);
    console.log("🗑️ Cleared all verification history");
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDrawer(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncate = (str, length = 40) => {
    if (!str) return 'N/A';
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-background)',
      paddingBottom: '40px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
        padding: '32px 24px',
        color: 'white',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h1 style={{ 
                fontSize: 'var(--font-size-3xl)', 
                fontWeight: '600', 
                margin: '0 0 8px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📜 Verification History
              </h1>
              <p style={{ 
                fontSize: 'var(--font-size-base)', 
                margin: 0,
                opacity: 0.9
              }}>
                {history.length} verification{history.length !== 1 ? 's' : ''} recorded locally
              </p>
            </div>
            <button
              onClick={() => navigate("/verifier-dashboard")}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              ← Back to Verifier
            </button>
          </div>

          {/* Clear All Button */}
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                padding: '8px 16px',
                background: 'rgba(245, 54, 92, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(245, 54, 92, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(245, 54, 92, 0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(245, 54, 92, 0.2)'}
            >
              🗑️ Clear All History
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {history.length === 0 ? (
          // Empty State
          <div className="wallet-empty-state">
            <div className="wallet-empty-icon">📭</div>
            <h2 className="wallet-empty-title">No Verification History</h2>
            <p className="wallet-empty-description">
              Verified credentials will appear here. Start verifying credentials to build your history.
            </p>
            <button
              onClick={() => navigate("/verifier-dashboard")}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Verify a Credential
            </button>
          </div>
        ) : (
          // History Grid
          <div className="wallet-card-grid">
            {history.map((item) => (
              <WalletCard
                key={item.id}
                type="Verification"
                title={item.vcType || "Verifiable Credential"}
                subtitle={formatDate(item.timestamp)}
                headerBadge={item.result === 'verified' ? 'Verified' : 'Failed'}
                icon={item.result === 'verified' ? '✓' : '✕'}
                meta={[
                  { label: 'CID', value: truncate(item.cid, 30) },
                  { label: 'Issuer', value: truncate(item.issuerDid, 30) },
                  { label: 'Subject', value: truncate(item.subjectDid, 30) },
                  { label: 'Hash Match', value: item.chainHashMatch ? '✓ Yes' : '✕ No' }
                ]}
                actions={[
                  {
                    label: 'View Details',
                    onClick: (e) => handleViewDetails(item),
                    variant: 'ghost',
                    icon: '👁️'
                  },
                  {
                    label: 'Delete',
                    onClick: (e) => handleDelete(item.id, e),
                    variant: 'danger',
                    icon: '🗑️'
                  }
                ]}
                onExpand={() => handleViewDetails(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Drawer */}
      <CardDetailsDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title="Verification Details"
      >
        {selectedItem && (
          <div style={{ fontSize: 'var(--font-size-sm)' }}>
            {/* Status */}
            <div style={{ 
              padding: '16px', 
              background: selectedItem.result === 'verified' 
                ? 'rgba(45, 206, 137, 0.1)' 
                : 'rgba(245, 54, 92, 0.1)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              border: `2px solid ${selectedItem.result === 'verified' ? 'var(--color-success)' : 'var(--color-error)'}`
            }}>
              <div style={{ 
                fontSize: 'var(--font-size-2xl)', 
                fontWeight: '600',
                color: selectedItem.result === 'verified' ? 'var(--color-success)' : 'var(--color-error)',
                marginBottom: '8px'
              }}>
                {selectedItem.result === 'verified' ? '✅ Verified' : '❌ Failed'}
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {formatDate(selectedItem.timestamp)}
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DetailRow label="Credential Type" value={selectedItem.vcType || 'N/A'} />
              <DetailRow label="IPFS CID" value={selectedItem.cid} mono />
              <DetailRow label="Issuer DID" value={selectedItem.issuerDid || 'N/A'} mono />
              <DetailRow label="Subject DID" value={selectedItem.subjectDid || 'N/A'} mono />
              <DetailRow 
                label="Blockchain Hash Match" 
                value={selectedItem.chainHashMatch ? '✓ Verified' : '✕ Failed'} 
                valueColor={selectedItem.chainHashMatch ? 'var(--color-success)' : 'var(--color-error)'}
              />
            </div>

            {/* Actions */}
            <div style={{ 
              marginTop: '32px', 
              paddingTop: '24px', 
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedItem.cid);
                  alert('CID copied to clipboard!');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-student-id-start)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                📋 Copy CID
              </button>
              <button
                onClick={(e) => {
                  setShowDrawer(false);
                  handleDelete(selectedItem.id, e);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(245, 54, 92, 0.1)',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </CardDetailsDrawer>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <>
          <div 
            className="wallet-drawer-overlay" 
            onClick={() => setShowClearConfirm(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1002,
            animation: 'scaleIn var(--transition-base)'
          }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: '600',
              marginBottom: '16px',
              color: 'var(--color-text-primary)'
            }}>
              Clear All History?
            </h3>
            <p style={{ 
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              This will permanently delete all {history.length} verification records from your local history.
              <br /><br />
              <strong>Note:</strong> This only affects your local view. Credentials on blockchain/IPFS are not affected.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-error)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value, mono = false, valueColor = 'var(--color-text-primary)' }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '4px',
      padding: '12px',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <div style={{ 
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 'var(--font-size-sm)',
        color: valueColor,
        fontWeight: '600',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all'
      }}>
        {value}
      </div>
    </div>
  );
}
