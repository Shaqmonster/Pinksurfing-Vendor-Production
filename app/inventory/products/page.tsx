"use client";
import { motion } from "framer-motion";
import { MyContext } from "@/app/providers/context";
import ProductsTable from "@/components/Tables/productTable";
import Loader from "@/components/common/Loader";
import { Product } from "@/types/product";
import { useContext, useEffect } from "react";

interface ProductsProps {
  products?: Product[];
  loading?: boolean;
}

const Products = ({ products, loading }: ProductsProps) => {
  const { sidebarOpen, setSidebarOpen } = useContext(MyContext);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, [setSidebarOpen]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Products Table */}
      {loading ? (
        <Loader />
      ) : (
        <div className="premium-card overflow-hidden">
          <ProductsTable Products={products} />
        </div>
      )}
    </motion.div>
  );
};

export default Products;
