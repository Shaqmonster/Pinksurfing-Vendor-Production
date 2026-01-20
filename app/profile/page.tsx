"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { getProfile } from "@/api/account";
import { useContext, useEffect, useState } from "react";
import { getProducts } from "@/api/products";
import { getOrders } from "@/api/orders";
import { MyContext } from "../providers/context";
import { useRouter } from "next/navigation";
import { 
  FaCamera, 
  FaCopy, 
  FaCheck, 
  FaStore, 
  FaBox, 
  FaShoppingCart,
  FaExternalLinkAlt,
  FaEdit
} from "react-icons/fa";
import { FiMapPin, FiMail, FiPhone, FiGlobe, FiPackage, FiTrendingUp } from "react-icons/fi";
import { getCookie } from "@/utils/cookies";
import Link from "next/link";

const Profile = () => {
  const [profile, setProfile] = useState<any>({
    name: "",
    first_name: "",
    contact_person_name: "",
    profile_pic: "",
    bio: "",
    store_name: "",
    slug: "",
    email: "",
    phone_number: "",
    city: "",
    country: "",
    website: "",
    store_image: "",
  });
  const [products, setProducts] = useState<number>(0);
  const [orders, setOrders] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const { setIsLoggedIn } = useContext(MyContext);
  const router = useRouter();

  useEffect(() => {
    let access = getCookie("access_token");
    let vendor_id = localStorage.getItem("vendor_id");
    const store: string | null = localStorage.getItem("store");
    
    if (access && store) {
      getProfile(access).then((data) => {
        if (data && "response" in data && data.response.status >= 400) {
          setIsLoggedIn(false);
          router.push("/");
        }
        if (data && "data" in data) {
          setProfile(data.data);
        }
      });
      
      const storeObject = JSON.parse(store);
      const store_name = storeObject.store_name;

      getProducts(access, store_name).then((data) => {
        if (data && "data" in data && "Products" in data.data) {
          setProducts(data.data.Products.length);
        }
      });

      getOrders(access).then((data) => {
        if (data && "data" in data && "Order Request" in data.data) {
          setOrders(data.data["Order Request"].length);
        }
      });
    }
  }, [setIsLoggedIn, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const stats = [
    { icon: FiPackage, label: "Products", value: products, color: "primary" },
    { icon: FiTrendingUp, label: "Orders", value: orders || 0, color: "purple" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Profile Header Card */}
      <motion.div variants={itemVariants} className="premium-card overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-pink">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          
          {/* Edit Cover Button */}
          <label className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors cursor-pointer">
            <FaCamera className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Cover</span>
            <input type="file" className="sr-only" accept="image/*" />
          </label>
        </div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-6 sm:left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-dark-card overflow-hidden bg-white dark:bg-dark-surface shadow-premium-lg">
                <Image
                  src={profile.store_image || "/images/user/ic_dummy_user.png"}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                <FaCamera className="w-4 h-4" />
                <input type="file" className="sr-only" accept="image/*" />
              </label>
            </div>
          </div>

          {/* Profile Details */}
          <div className="pt-20 sm:pt-4 sm:pl-40">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                  {profile.contact_person_name || profile.name || profile.first_name || "Vendor"}
                </h1>
                <p className="text-lg text-surface-600 dark:text-surface-400 flex items-center gap-2 mt-1">
                  <FaStore className="w-4 h-4" />
                  {profile.store_name || "Store Name"}
                </p>

                {/* Store Link */}
                {profile.slug && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://pinksurfing.com/store/${profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        <FiGlobe className="w-4 h-4" />
                        pinksurfing.com/store/{profile.slug}
                        <FaExternalLinkAlt className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://pinksurfing.com/store/${profile.slug}`
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          copied
                            ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success"
                            : "bg-surface-100 dark:bg-dark-surface text-surface-500 hover:text-primary-500"
                        }`}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                      >
                        {copied ? <FaCheck className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                      Share this link with your customers
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Profile Button */}
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors font-medium"
              >
                <FaEdit className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-light-border dark:border-dark-border">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${
                    stat.color === "primary" ? "bg-primary-100 dark:bg-primary-500/20" : "bg-accent-purple/10 dark:bg-accent-purple/20"
                  } flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "primary" ? "text-primary-600 dark:text-primary-400" : "text-accent-purple"
                    }`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* About & Contact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 premium-card p-6">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-pink rounded-full" />
            About
          </h2>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
            {profile.bio || "No bio added yet. Add a bio to tell customers about your store and what makes it special."}
          </p>
          {!profile.bio && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 mt-4 text-primary-500 hover:text-primary-600 font-medium text-sm transition-colors"
            >
              Add a bio
              <FaEdit className="w-3 h-3" />
            </Link>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div variants={itemVariants} className="premium-card p-6">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-purple rounded-full" />
            Contact Info
          </h2>
          <div className="space-y-4">
            {profile.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                  <FiMail className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Email</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
            )}
            {profile.phone_number && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                  <FiPhone className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Phone</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{profile.phone_number}</p>
                </div>
              </div>
            )}
            {(profile.city || profile.country) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                  <FiMapPin className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Location</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {[profile.city, profile.country].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                  <FiGlobe className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Website</p>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-500 hover:text-primary-600"
                  >
                    {profile.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="premium-card p-6">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FaBox, label: "View Products", href: "/inventory/products", count: products },
            { icon: FaShoppingCart, label: "View Orders", href: "/orders", count: orders },
            { icon: FaEdit, label: "Edit Settings", href: "/settings" },
            { icon: FaStore, label: "Add Product", href: "/inventory/add_products" },
          ].map((action, index) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-surface-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors relative">
                <action.icon className="w-6 h-6 text-surface-600 dark:text-surface-400 group-hover:text-white" />
                {action.count !== undefined && action.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {action.count}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-surface-600 dark:text-surface-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
