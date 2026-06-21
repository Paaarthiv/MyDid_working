import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userAddress, setUserAddress] = useState(null);
  const [did, setDid] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [vcData, setVcData] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("userAddress");
    const savedDid = localStorage.getItem("did");
    const savedPublicKey = localStorage.getItem("publicKey");
    const savedRole = localStorage.getItem("userRole");
    const savedToken = localStorage.getItem("authToken");

    if (savedAddress && savedDid && savedPublicKey && savedRole && savedToken) {
      setUserAddress(savedAddress);
      setDid(savedDid);
      setPublicKey(savedPublicKey);
      setUserRole(savedRole);
      setAuthToken(savedToken);
    }
  }, []);

  const login = (address, didValue, pubKey, role, token) => {
    setUserAddress(address);
    setDid(didValue);
    setPublicKey(pubKey);
    setUserRole(role);
    setAuthToken(token);

    // Store in localStorage
    localStorage.setItem("userAddress", address);
    localStorage.setItem("did", didValue);
    localStorage.setItem("publicKey", pubKey);
    localStorage.setItem("userRole", role);
    if (token) {
      localStorage.setItem("authToken", token);
    }
  };

  const logout = () => {
    setUserAddress(null);
    setDid(null);
    setPublicKey(null);
    setUserRole(null);
    setAuthToken(null);
    setVcData(null);

    // Clear localStorage
    localStorage.removeItem("userAddress");
    localStorage.removeItem("did");
    localStorage.removeItem("publicKey");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
  };

  const value = {
    userAddress,
    did,
    publicKey,
    userRole,
    authToken,
    vcData,
    setVcData,
    login,
    logout,
    isAuthenticated: !!userAddress && !!userRole && !!authToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
