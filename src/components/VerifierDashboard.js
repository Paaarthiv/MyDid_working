import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, User, Shield } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function VerifierDashboard() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatedPage className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex justify-end"
        >
          <button
            onClick={() => {
              if (window.confirm("Return to portal selection? You will be logged out.")) {
                localStorage.clear();
                navigate("/");
              }
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
          >
            ← Back to Home
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0F2027] to-[#28623A] rounded-2xl shadow-lg shadow-emerald-500/50 mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 pb-2 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
            Verifier Dashboard
          </h1>
          <p className="text-slate-400 text-lg">Verify and validate credentials</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/verifier")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-green-500/10 hover:border-emerald-500/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#0F2027] to-[#28623A] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verify Credential</h3>
            <p className="text-slate-400 text-sm">Scan QR code or enter CID to verify credentials</p>
          </motion.button>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/verifier/profile")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-green-500/10 hover:border-emerald-500/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#0F2027] to-[#28623A] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">View Profile</h3>
            <p className="text-slate-400 text-sm">View your wallet address, DID, and public key</p>
          </motion.button>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
