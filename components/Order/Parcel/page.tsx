import { useState } from "react";

const Parcel = ({ isOpen, onClose, onSubmit }) => {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const handleSubmit = () => {
    onSubmit({ length, width, height, weight });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Enter Package Details</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Length</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded dark:text-black"
            placeholder="Enter length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Width</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded dark:text-black"
            placeholder="Enter width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Height</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded dark:text-black"
            placeholder="Enter height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Weight</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded dark:text-black"
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black dark:text-white py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Parcel;
