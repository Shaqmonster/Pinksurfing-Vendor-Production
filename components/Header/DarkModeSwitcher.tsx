"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";

const DarkModeSwitcher = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface" />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      className="relative w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors flex items-center justify-center overflow-hidden"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <FiMoon className="w-5 h-5 text-accent-purple" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <FiSun className="w-5 h-5 text-accent-amber" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background glow effect */}
      <motion.div
        animate={{
          scale: darkMode ? [1, 1.2, 1] : [1, 1.2, 1],
          opacity: darkMode ? [0.5, 0.8, 0.5] : [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute inset-0 rounded-xl ${
          darkMode ? "bg-accent-purple/10" : "bg-accent-amber/10"
        }`}
      />
    </motion.button>
  );
};

export default DarkModeSwitcher;
