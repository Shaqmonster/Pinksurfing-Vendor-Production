"use client";

import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg relative w-full max-w-md mx-4">
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-primary rounded-full p-4 shadow-md">
          <FaExclamationTriangle className="text-yellow-500" size={32} />
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-lg font-bold mb-2 text-black dark:text-white">
            Confirm Deletion
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            This action can't be undone. Are you sure you want to delete this product?
          </p>
          <div className="flex justify-center mt-6">
            <button
              className="px-4 py-2 mr-2 text-white bg-gray-600 rounded hover:bg-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
