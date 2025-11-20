import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Portal background gradients
const getPortalBackground = (pathname) => {
  if (pathname.startsWith('/issuer')) {
    // Navy Mirage
    return 'linear-gradient(135deg, #141E30, #35577D)';
  } else if (pathname.startsWith('/holder')) {
    // Obsidian Plum
    return 'linear-gradient(135deg, #2D1E2F, #4E2A4F)';
  } else if (pathname.startsWith('/verifier')) {
    // Emerald Depth
    return 'linear-gradient(135deg, #0F2027, #28623A)';
  }
  // Default fallback
  return 'linear-gradient(135deg, #1e293b, #334155)';
};

export default function AnimatedPage({ children, className = '' }) {
  const location = useLocation();
  const background = getPortalBackground(location.pathname);

  return (
    <>
      {/* Fixed gradient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background }}
      />

      {/* Animated content */}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </>
  );
}
