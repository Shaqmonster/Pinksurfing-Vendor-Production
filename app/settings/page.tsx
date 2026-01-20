"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getVendorProfile, updateVendorProfile } from "@/api/products";
import { Loader2 } from "@/components/common/Loader";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiFileText,
  FiSave,
  FiX,
  FiHome,
  FiMap,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import Link from "next/link";

const Settings = () => {
  const tokenFromLocalStorage =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;
  const [token, setToken] = useState<string | null>(tokenFromLocalStorage);

  const [storeName, setStoreName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await getVendorProfile(token);
      if (!error) {
        setStoreName(data.store_name || "");
        setContactPersonName(data.contact_person_name || "");
        setEmail(data.email || "");
        setPhoneNumber(data.phone_number || "");
        setStreet1(data.street1 || "");
        setStreet2(data.street2 || "");
        setCity(data.city || "");
        setState(data.state || "");
        setCountry(data.country || "");
        setZipCode(data.zip_code || "");
        setWebsite(data.website || "");
        setBio(data.bio || "");
      } else {
        console.error("Error fetching profile:", error);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedData = {
      store_name: storeName,
      contact_person_name: contactPersonName,
      email: email,
      phone_number: phoneNumber,
      street1: street1,
      street2: street2,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode,
      website: website,
      bio: bio,
    };

    try {
      const { data, error } = await updateVendorProfile(token, updatedData);
      if (!error) {
        toast.success("Profile updated successfully!");
        await fetchProfile();
      } else {
        toast.error(
          data?.response?.data?.error ||
            data?.response?.data?.website?.[0] ||
            "Error updating profile"
        );
        console.error("Error updating profile:", error);
      }
    } catch (error) {
      toast.error("Unexpected error, please try again later");
      console.error("Unexpected error:", error);
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const inputClasses =
    "input-premium";

  const labelClasses =
    "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2";

  return (
    <>
      {(loading || saving) && <Loader2 />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
              Store Settings
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Manage your store information and preferences
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
          >
            <FaStore className="w-4 h-4" />
            View Profile
          </Link>
        </motion.div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Store Information */}
          <motion.div variants={itemVariants} className="premium-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-pink flex items-center justify-center">
                <FaStore className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Store Information
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Basic details about your store
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FaStore className="w-4 h-4" />
                    Store Name
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="Your store name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Contact Person Name
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="Full name"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    Email Address
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    Phone Number
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4" />
                    Website
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Address Information */}
          <motion.div variants={itemVariants} className="premium-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
                <FiMapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Address Information
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Your store's physical address
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiHome className="w-4 h-4" />
                    Street Address 1
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="123 Main Street"
                  value={street1}
                  onChange={(e) => setStreet1(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiHome className="w-4 h-4" />
                    Street Address 2
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={street2}
                  onChange={(e) => setStreet2(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiMap className="w-4 h-4" />
                    City
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiMap className="w-4 h-4" />
                    State / Province
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4" />
                    Country
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4" />
                    ZIP / Postal Code
                  </span>
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  placeholder="ZIP Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div variants={itemVariants} className="premium-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  About Your Store
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Tell customers what makes your store special
                </p>
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  Bio / Description
                </span>
              </label>
              <textarea
                className={`${inputClasses} min-h-[150px] resize-y`}
                placeholder="Write a brief description about your store, your products, and what makes you unique..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                {bio.length}/500 characters
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-end gap-3"
          >
            <button
              type="button"
              onClick={() => fetchProfile()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors font-medium"
            >
              <FiX className="w-5 h-5" />
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-pink text-white font-semibold shadow-glow-pink hover:shadow-premium-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </>
  );
};

export default Settings;
