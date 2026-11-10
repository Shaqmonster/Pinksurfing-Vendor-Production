"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { PS_MOTION } from "@/lib/motion-tokens";

const DarkModeSwitcher = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return (
      <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 dark:bg-dark-surface" />
    );
  }

  return (
    <motion.button
      whileTap={reduced ? undefined : { scale: PS_MOTION.scale.pressed }}
      onClick={toggleDarkMode}
      className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 dark:bg-dark-surface hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors flex items-center justify-center overflow-hidden"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="moon"
            initial={reduced ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -12, opacity: 0 }}
            transition={{ duration: PS_MOTION.duration.fast }}
          >
            <FiMoon className="w-5 h-5 text-primary-400" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={reduced ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -12, opacity: 0 }}
            transition={{ duration: PS_MOTION.duration.fast }}
          >
            <FiSun className="w-5 h-5 text-accent-amber" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default DarkModeSwitcher;
