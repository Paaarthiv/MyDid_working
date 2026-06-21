import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./VCForm.css";


function VCForm() {
  const { userAddress, setVcData } = useAuth();
  const [formData, setFormData] = useState({ name: "", rollNumber: "", dob: "", department: "", photo: null });
  const [registeredHolders, setRegisteredHolders] = useState([]);
  const [selectedHolder, setSelectedHolder] = useState("");
  const [loadingHolders, setLoadingHolders] = useState(true);
  const navigate = useNavigate();

  // Fetch registered holders on component mount
  useEffect(() => {
    fetchRegisteredHolders();
  }, []);

  const fetchRegisteredHolders = async () => {
    try {
      setLoadingHolders(true);
      const response = await axios.get("/getRegisteredHolders");
      if (response.data.success) {
        setRegisteredHolders(response.data.holders);
      }
    } catch (err) {
      console.error("Error fetching holders:", err);
    } finally {
      setLoadingHolders(false);
    }
  };

  const handleChange = e => {
    if (e.target.name === "photo") setFormData({ ...formData, photo: e.target.files[0] });
    else setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.photo) return alert("Please select a photo.");
    if (!selectedHolder) return alert("Please select a holder to issue the credential to.");

    const data = new FormData();
    for (let key in formData) data.append(key, formData[key]);
    data.append("address", userAddress);
    data.append("holderDID", selectedHolder); // Add selected holder's DID

    try {
      const response = await axios.post("/issueVC", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("VC Response:", response.data);
      
      // Link VC to holder
      if (response.data.vc && response.data.ipfs?.vcCID) {
        const vcCID = response.data.ipfs.vcCID;
        const documentHash = response.data.documentHash;

        // Interact with MetaMask to anchor on blockchain
        const contractAddress = import.meta.env.VITE_VC_CONTRACT_ADDRESS;
        if (window.ethereum && contractAddress && documentHash && vcCID) {
          try {
            console.log('⛓️ Prompting MetaMask to anchor VC to blockchain...');
            const { ethers } = await import("ethers");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            const abi = [
              "function storeVC(string memory documentHash, string memory ipfsCID) public returns (uint256)"
            ];
            const vcContract = new ethers.Contract(contractAddress, abi, signer);
            
            const tx = await vcContract.storeVC(documentHash, vcCID);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ VC anchored to blockchain!`);
          } catch (blockchainError) {
            console.error("⚠️ Blockchain anchoring failed (continuing anyway):", blockchainError);
            alert("Warning: Blockchain anchoring failed or was rejected. The VC was still issued off-chain.");
          }
        }

        await axios.post("/linkVCToHolder", {
          holderDID: selectedHolder,
          vcCID: vcCID
        });
      }
      
      setVcData(response.data); // store VC in App state
      navigate("/view");        // redirect to VC page
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "VC issuance failed.");
    }
  };


  return (
    <div className="vc-container">
      <h2>Issue VC</h2>
      <form onSubmit={handleSubmit}>
        {/* Holder Selection */}
        <div className="form-group">
          <label htmlFor="holderSelect" style={{ color: '#000', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            🎯 Select Holder (Recipient) *
          </label>
          {loadingHolders ? (
            <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', color: '#666' }}>
              Loading registered holders...
            </div>
          ) : registeredHolders.length === 0 ? (
            <div style={{ padding: '12px', background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '8px', color: '#92400e' }}>
              ⚠️ No holders have shared their DID yet. Ask holders to share their DID first.
            </div>
          ) : (
            <select
              id="holderSelect"
              value={selectedHolder}
              onChange={(e) => setSelectedHolder(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#000',
                background: '#fff'
              }}
            >
              <option value="">-- Select a holder --</option>
              {registeredHolders.map((holder) => (
                <option key={holder.holderDID} value={holder.holderDID}>
                  {holder.holderName} ({holder.holderAddress.slice(0, 6)}...{holder.holderAddress.slice(-4)})
                </option>
              ))}
            </select>
          )}
          {selectedHolder && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#dbeafe', borderRadius: '6px' }}>
              <small style={{ color: '#1e40af', fontWeight: '600' }}>
                ✅ Credential will be issued to: {registeredHolders.find(h => h.holderDID === selectedHolder)?.holderName}
              </small>
            </div>
          )}
        </div>

        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="text" name="rollNumber" placeholder="Roll Number" onChange={handleChange} required />
        <input type="date" name="dob" onChange={handleChange} required />
        <input type="text" name="department" placeholder="Department" onChange={handleChange} required />
        <input type="file" name="photo" onChange={handleChange} accept="image/*" required />
        <button type="submit" disabled={!selectedHolder || loadingHolders}>Issue VC to Selected Holder</button>
      </form>
    </div>
  );
}

export default VCForm;
