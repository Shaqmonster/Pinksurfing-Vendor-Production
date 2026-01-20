"use client";
import { motion } from "framer-motion";
import { FaStore } from "react-icons/fa";

const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-300"
          />
          
          {/* Inner ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 w-16 h-16 rounded-full border-4 border-transparent border-b-accent-purple border-l-accent-purple/50"
          />
          
          {/* Logo center */}
          <div className="w-20 h-20 rounded-full bg-gradient-pink flex items-center justify-center shadow-glow-pink">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <FaStore className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
            Loading...
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Please wait a moment
          </p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const Loader2 = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-3 border-surface-200 dark:border-dark-border border-t-primary-500"
          />
        </div>
        
        {/* Loading text */}
        <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
          Processing...
        </p>
      </div>
    </motion.div>
  );
};

// Skeleton loader for content
export const SkeletonLoader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`skeleton ${className}`}>
      <div className="h-full w-full" />
    </div>
  );
};

// Card skeleton
export const CardSkeleton = () => {
  return (
    <div className="premium-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <SkeletonLoader className="w-12 h-12 rounded-xl" />
        <SkeletonLoader className="w-16 h-6 rounded-full" />
      </div>
      <SkeletonLoader className="w-24 h-8 rounded-lg" />
      <SkeletonLoader className="w-32 h-4 rounded" />
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton = () => {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonLoader className="w-40 h-4 rounded" />
          <SkeletonLoader className="w-24 h-3 rounded" />
        </div>
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="w-8 h-8 rounded-lg" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="w-16 h-6 rounded" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="w-24 h-6 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="w-20 h-4 rounded" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="w-8 h-8 rounded-lg ml-auto" />
      </td>
    </tr>
  );
};

export default Loader;
