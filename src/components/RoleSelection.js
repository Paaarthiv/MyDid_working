import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, User, Search, Shield, ArrowRight } from "lucide-react";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "issuer",
      title: "Issuer Portal",
      icon: Building2,
      description: "Issue and manage verifiable credentials",
      color: "from-[#141E30] to-[#35577D]",
      hoverColor: "hover:from-[#0F1922] hover:to-[#2E4A6B]",
      bgGlow: "bg-[#35577D]/20",
      route: "/issuer-login",
      features: ["Create VCs", "Manage Credentials", "BBS+ Signatures"]
    },
    {
      id: "holder",
      title: "Holder Portal",
      icon: User,
      description: "Store and share your credentials securely",
      color: "from-[#2D1E2F] to-[#4E2A4F]",
      hoverColor: "hover:from-[#231823] hover:to-[#3E2240]",
      bgGlow: "bg-[#4E2A4F]/20",
      route: "/holder-login",
      features: ["View VCs", "Selective Disclosure", "Share Proofs"]
    },
    {
      id: "verifier",
      title: "Verifier Portal",
      icon: Search,
      description: "Verify credential authenticity",
      color: "from-[#0F2027] to-[#28623A]",
      hoverColor: "hover:from-[#0A1419] hover:to-[#1F5030]",
      bgGlow: "bg-[#28623A]/20",
      route: "/verifier-login",
      features: ["Scan QR Codes", "Verify Signatures", "Check Blockchain"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 w-full max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/50 mb-6"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]">
            DID Vault
          </h1>
          <p className="text-slate-400 text-xl mb-2">Decentralized Digital Identity Management</p>
          <p className="text-slate-500 text-lg">Choose your portal to continue</p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                variants={cardVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(role.route)}
                className="cursor-pointer group"
              >
                <div className="relative h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:border-slate-600/50 hover:shadow-2xl">
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 ${role.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 mb-6 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-between">
                      {role.title}
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
                    </h2>

                    {/* Description */}
                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                      {role.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {role.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center space-x-2 text-slate-300 text-sm"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.color}`} />
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full mt-6 py-3 px-6 bg-gradient-to-r ${role.color} ${role.hoverColor} text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2`}
                    >
                      <span>Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <p>Powered by Ethereum • IPFS • BBS+ Signatures</p>
        </motion.div>
      </div>
    </div>
  );
}

export default RoleSelection;
