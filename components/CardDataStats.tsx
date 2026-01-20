"use client";
import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

interface CardDataStatsProps {
  title: string;
  total: string;
  rate: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children: ReactNode;
  gradient?: "pink" | "purple" | "blue" | "emerald" | "amber";
}

const gradients = {
  pink: "bg-gradient-pink",
  purple: "bg-gradient-purple",
  blue: "bg-gradient-blue",
  emerald: "bg-gradient-emerald",
  amber: "bg-gradient-amber",
};

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  rate,
  levelUp,
  levelDown,
  children,
  gradient = "pink",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="premium-card p-6 group cursor-pointer relative overflow-hidden"
    >
      {/* Decorative gradient orb */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 ${gradients[gradient]} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="relative z-10">
        {/* Icon Container */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${gradients[gradient]} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <div className="text-white">
            {children}
          </div>
        </div>

        {/* Stats Content */}
        <div className="flex items-end justify-between">
          <div>
            <h4 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-1">
              {total}
            </h4>
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {title}
            </span>
          </div>

          {/* Rate Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              levelUp
                ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success"
                : levelDown
                ? "bg-danger-light text-danger-dark dark:bg-danger/20 dark:text-danger"
                : "bg-surface-100 text-surface-500 dark:bg-dark-surface dark:text-surface-400"
            }`}
          >
            {levelUp && <FiTrendingUp className="w-3 h-3" />}
            {levelDown && <FiTrendingDown className="w-3 h-3" />}
            {rate}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CardDataStats;
