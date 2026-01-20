"use client";
import { motion } from "framer-motion";
import OrderTable from "@/components/Tables/OrderTable";
import { FiShoppingCart, FiFilter, FiDownload } from "react-icons/fi";

const Orders = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >

      {/* Orders Table */}
      <div className="premium-card overflow-hidden">
        <OrderTable />
      </div>
    </motion.div>
  );
};

export default Orders;
