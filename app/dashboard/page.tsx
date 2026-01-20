"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiShoppingBag, 
  FiDollarSign, 
  FiPackage, 
  FiUsers,
  FiArrowRight,
  FiMoreHorizontal
} from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineCube, HiOutlineShoppingCart, HiOutlineCurrencyDollar } from "react-icons/hi";
import { getTopSellingProducts } from "@/api/products";
import OrderTable from "@/components/Tables/OrderTable";
import { getCookie } from "@/utils/cookies";
import Link from "next/link";

const Dashboard: React.FC = () => {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  
  useMemo(() => {
    if (typeof window !== "undefined") {
      let token = getCookie("access_token");
      if (!token) return;
      (async () => {
        const res = await getTopSellingProducts(token);
        setTopProducts(res.data || []);
      })();
    }
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Stats data
  const stats = [
    {
      title: "Total Revenue",
      value: "$24,780",
      change: "+12.5%",
      trend: "up",
      icon: HiOutlineCurrencyDollar,
      gradient: "from-primary-500 to-accent-purple",
      bgGradient: "bg-gradient-pink",
    },
    {
      title: "Total Orders",
      value: "1,248",
      change: "+8.2%",
      trend: "up",
      icon: HiOutlineShoppingCart,
      gradient: "from-accent-purple to-accent-blue",
      bgGradient: "bg-gradient-purple",
    },
    {
      title: "Total Products",
      value: "156",
      change: "+3.1%",
      trend: "up",
      icon: HiOutlineCube,
      gradient: "from-accent-blue to-accent-cyan",
      bgGradient: "bg-gradient-blue",
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "-0.4%",
      trend: "down",
      icon: FiTrendingUp,
      gradient: "from-accent-emerald to-accent-teal",
      bgGradient: "bg-gradient-emerald",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >

      {/* Stats Grid */}
      {/* <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="premium-card premium-card-hover p-6 group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgGradient} flex items-center justify-center shadow-premium-sm group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                stat.trend === "up" 
                  ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success" 
                  : "bg-danger-light text-danger-dark dark:bg-danger/20 dark:text-danger"
              }`}>
                {stat.trend === "up" ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div> */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="premium-card h-full">
            <div className="p-6 border-b border-light-border dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-white">Top Products</h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Best performing items</p>
                </div>
                <button className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover transition-colors">
                  <FiMoreHorizontal className="w-5 h-5 text-surface-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {topProducts && topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {product.category?.name || "Product"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success dark:text-success">
                        ${product.unit_price}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                    <FiPackage className="w-8 h-8 text-surface-400" />
                  </div>
                  <p className="text-surface-500 dark:text-surface-400 mb-3">No products yet</p>
                  <Link
                    href="/inventory/add_products"
                    className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium text-sm"
                  >
                    Add your first product
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
            {topProducts && topProducts.length > 0 && (
              <div className="p-6 pt-0">
                <Link
                  href="/inventory/products"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-surface-200 dark:border-dark-border text-surface-500 dark:text-surface-400 hover:border-primary-500 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  View all products
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="premium-card overflow-hidden">
            <OrderTable recentOrders={true} />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="premium-card p-6">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiPackage, label: "Add Product", href: "/inventory/add_products", color: "primary" },
              { icon: FiShoppingBag, label: "View Orders", href: "/orders", color: "purple" },
              { icon: FiUsers, label: "Edit Profile", href: "/profile", color: "blue" },
              { icon: FiDollarSign, label: "Store Settings", href: "/settings", color: "emerald" },
            ].map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-surface-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <action.icon className="w-6 h-6 text-surface-600 dark:text-surface-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
