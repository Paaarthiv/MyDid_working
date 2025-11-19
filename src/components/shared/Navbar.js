import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  FileText, 
  Shield, 
  User, 
  Menu, 
  X,
  Wallet,
  LogOut,
  Building2,
  Search,
  UserCircle
} from 'lucide-react';

export default function Navbar({ userAddress, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Role-based navigation items
  const getRoleNavItems = () => {
    switch (userRole) {
      case 'issuer':
        return [
          { path: '/issuer-dashboard', label: 'Dashboard', icon: Home },
          { path: '/issuer/requests', label: 'Handle Requests', icon: FileText },
          { path: '/issuer/view-issued', label: 'View Issued', icon: Shield },
          { path: '/issuer/profile', label: 'Profile', icon: User },
        ];
      case 'holder':
        return [
          { path: '/holder-dashboard', label: 'Dashboard', icon: Home },
          { path: '/holder', label: 'My VCs', icon: Shield },
          { path: '/holder/request-credential', label: 'Request VC', icon: FileText },
          { path: '/holder/profile', label: 'Profile', icon: UserCircle },
        ];
      case 'verifier':
        return [
          { path: '/verifier-dashboard', label: 'Dashboard', icon: Home },
          { path: '/verifier', label: 'Verify', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const navItems = getRoleNavItems();

  // Role indicator config
  const getRoleConfig = () => {
    switch (userRole) {
      case 'issuer':
        return {
          icon: Building2,
          label: 'Issuer Portal',
          color: 'from-blue-400 to-cyan-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30'
        };
      case 'holder':
        return {
          icon: User,
          label: 'Holder Portal',
          color: 'from-green-400 to-emerald-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30'
        };
      case 'verifier':
        return {
          icon: Search,
          label: 'Verifier Portal',
          color: 'from-purple-400 to-violet-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30'
        };
      default:
        return null;
    }
  };

  const roleConfig = getRoleConfig();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-400/60 ring-2 ring-white/30"
              style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3)' }}
            >
              <Shield className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </motion.div>
            <span 
              className="text-2xl font-extrabold hidden sm:block"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #60a5fa 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 12px rgba(99, 102, 241, 0.8)) drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))',
                textShadow: '0 0 30px rgba(99, 102, 241, 0.5)'
              }}
            >
              DigiLocker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-indigo-600/20 text-indigo-400 shadow-lg shadow-indigo-500/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userAddress ? (
              <>
                {/* Role Indicator */}
                {roleConfig && (
                  <div className={`flex items-center space-x-2 px-4 py-2 ${roleConfig.bgColor} rounded-xl border ${roleConfig.borderColor}`}>
                    {React.createElement(roleConfig.icon, { className: 'w-4 h-4' })}
                    <span className={`text-sm font-semibold bg-gradient-to-r ${roleConfig.color} bg-clip-text text-transparent`}>
                      {roleConfig.label}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-mono text-slate-300">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-600/30 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </>
            ) : (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                >
                  Connect Wallet
                </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-indigo-600/20 text-indigo-400'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {userAddress && (
                <>
                  {/* Mobile Role Indicator */}
                  {roleConfig && (
                    <div className={`flex items-center space-x-2 px-4 py-3 ${roleConfig.bgColor} rounded-xl border ${roleConfig.borderColor}`}>
                      {React.createElement(roleConfig.icon, { className: 'w-5 h-5' })}
                      <span className={`text-sm font-semibold bg-gradient-to-r ${roleConfig.color} bg-clip-text text-transparent`}>
                        {roleConfig.label}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Wallet className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-mono text-slate-300">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
