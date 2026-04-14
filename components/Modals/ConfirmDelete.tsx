"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  // Track whether we're on the client (createPortal needs document.body)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  // Render into document.body so framer-motion CSS transforms on table rows
  // cannot create a new containing block for position:fixed
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-premium-lg w-full max-w-sm mx-4 overflow-hidden">
        {/* Icon row */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-full bg-warning-light dark:bg-warning/20 flex items-center justify-center">
            <FaExclamationTriangle className="text-warning-dark dark:text-warning" size={28} />
          </div>
        </div>

        {/* Text */}
        <div className="px-6 pb-2 text-center">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
            Confirm Deletion
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            This action can&apos;t be undone. Are you sure you want to delete this product?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6">
          <button
            className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-dark-hover font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white font-semibold hover:bg-red-700 transition-colors shadow-premium-sm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
