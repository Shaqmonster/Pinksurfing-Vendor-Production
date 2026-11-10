"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border shadow-premium-lg w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-warning-light dark:bg-warning/20 flex items-center justify-center">
            <FaExclamationTriangle
              className="text-warning-dark dark:text-warning"
              size={28}
              aria-hidden
            />
          </div>
        </div>

        <div className="px-6 pb-2 text-center">
          <h2
            id="confirm-delete-title"
            className="text-lg font-bold text-surface-900 dark:text-white mb-2"
          >
            Confirm deletion
          </h2>
          <p
            id="confirm-delete-desc"
            className="text-sm text-surface-500 dark:text-surface-400"
          >
            This action can&apos;t be undone. Are you sure you want to delete this
            product?
          </p>
        </div>

        <div className="flex gap-3 p-6">
          <button
            ref={cancelRef}
            type="button"
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-dark-hover font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-danger text-white font-semibold hover:bg-red-700 transition-colors shadow-premium-sm"
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
