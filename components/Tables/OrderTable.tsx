"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  changeStatus,
  getOrders,
  getParcelDetails,
  buyShipmentLabel,
  getShippingDetails,
} from "@/api/orders";
import { Package } from "@/types/package";
import Link from "next/link";
import Loader from "../common/Loader";
import Parcel from "../Order/Parcel/page";
import { toast } from "react-toastify";
import { getCookie } from "@/utils/cookies";
import { 
  FiPackage, 
  FiArrowRight, 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiAlertCircle,
  FiMoreHorizontal,
  FiDownload,
  FiExternalLink
} from "react-icons/fi";

interface Order {
  id: string;
  product: { name: string };
  quantity: number;
  total_price: number;
  order_status: string;
  date_of_order: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { icon: React.ElementType; bgColor: string; textColor: string; label: string } } = {
    PENDING: {
      icon: FiClock,
      bgColor: "bg-warning-light dark:bg-warning/20",
      textColor: "text-warning-dark dark:text-warning",
      label: "Pending",
    },
    RECEIVED: {
      icon: FiCheckCircle,
      bgColor: "bg-info-light dark:bg-info/20",
      textColor: "text-info-dark dark:text-info",
      label: "Received",
    },
    PACKED: {
      icon: FiPackage,
      bgColor: "bg-accent-purple/10 dark:bg-accent-purple/20",
      textColor: "text-accent-purple dark:text-accent-purple",
      label: "Packed",
    },
    SHIPPED: {
      icon: FiTruck,
      bgColor: "bg-accent-blue/10 dark:bg-accent-blue/20",
      textColor: "text-accent-blue dark:text-accent-blue",
      label: "Shipped",
    },
    DELIVERED: {
      icon: FiCheckCircle,
      bgColor: "bg-success-light dark:bg-success/20",
      textColor: "text-success-dark dark:text-success",
      label: "Delivered",
    },
    CANCELED: {
      icon: FiAlertCircle,
      bgColor: "bg-danger-light dark:bg-danger/20",
      textColor: "text-danger-dark dark:text-danger",
      label: "Canceled",
    },
    "RETURN-REQUESTED": {
      icon: FiAlertCircle,
      bgColor: "bg-warning-light dark:bg-warning/20",
      textColor: "text-warning-dark dark:text-warning",
      label: "Return Requested",
    },
    RETURNED: {
      icon: FiPackage,
      bgColor: "bg-surface-200 dark:bg-surface-700",
      textColor: "text-surface-600 dark:text-surface-400",
      label: "Returned",
    },
    ERROR: {
      icon: FiAlertCircle,
      bgColor: "bg-danger-light dark:bg-danger/20",
      textColor: "text-danger-dark dark:text-danger",
      label: "Error",
    },
  };
  return configs[status] || configs.PENDING;
};

const OrderTable = ({ recentOrders }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labelUrls, setLabelUrls] = useState<{ [key: string]: string }>({});
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const orderStatuses = [
    "PENDING",
    "RECEIVED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELED",
    "RETURN-REQUESTED",
    "RETURNED",
    "ERROR",
  ];

  const vendor_id =
    typeof window !== "undefined" ? getCookie("access_token") : "";

  useEffect(() => {
    if (!vendor_id) return;

    setLoading(true);
    getOrders(vendor_id).then((data: any) => {
      if (
        typeof data === "object" &&
        "data" in data &&
        "Order Request" in data.data
      ) {
        setLoading(false);
        let orders = data.data["Order Request"];
        orders = orders.filter(
          (order: Order) => order.order_status !== "PENDING"
        );
        if (Array.isArray(orders) && orders.length) {
          if (recentOrders) {
            setOrders(orders.slice(0, 4));
          } else {
            setOrders(orders.slice(0, 10));
          }
        }
      }
    });
  }, [vendor_id]);

  useEffect(() => {
    if (orders.length === 0) return;

    orders.forEach((order) => {
      if (order.order_status === "PACKED") {
        getShippingDetails(order.id, vendor_id)
          .then((response: any) => {
            if (response && response.data) {
              setLabelUrls((prevUrls) => ({
                ...prevUrls,
                [order.id]: response.data.postage_label_url,
              }));
            }
          })
          .catch((error) => {
            toast.error("Failed to retrieve shipping details.");
          });
      }
    });
  }, [orders, vendor_id]);

  const handleStatusChange = (order: Order, newStatus: string) => {
    if (newStatus === "PACKED") {
      setCurrentOrder(order);
      setIsModalOpen(true);
    } else {
      changeStatus(getCookie("access_token"), order.id, newStatus).then(
        () => {
          setOrders((prevOrders) =>
            prevOrders.map((o) =>
              o.id === order.id ? { ...o, order_status: newStatus } : o
            )
          );
        }
      );
    }
  };

  const handleParcelSubmit = (details: Package) => {
    if (currentOrder) {
      changeStatus(
        getCookie("access_token"),
        currentOrder.id,
        "PACKED",
        details.length,
        details.width,
        details.height,
        details.weight
      )
        .then(() => {
          setOrders((prevOrders) =>
            prevOrders.map((o) =>
              o.id === currentOrder.id ? { ...o, order_status: "PACKED" } : o
            )
          );
          setIsModalOpen(false);
          toast.success("Order status updated to PACKED successfully!");

          getParcelDetails(currentOrder.id, vendor_id).then(
            (parcelData: any) => {
              if (parcelData && parcelData.data) {
                buyShipmentLabel(parcelData.data.parcel_id, vendor_id)
                  .then((res) => {
                    setLabelUrls((prev) => ({
                      ...prev,
                      [currentOrder.id]: res.data.label_url,
                    }));
                  })
                  .catch((error) => {
                    toast.error(
                      "Failed to purchase shipment label. Please try again."
                    );
                  });
              }
            }
          );
        })
        .catch((error) => {
          toast.error("Failed to update order status. Please try again.");
        });
    }
  };

  return (
    <>
      {loading ? (
        <div className="p-8">
          <Loader />
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  {recentOrders ? "Recent Orders" : "All Orders"}
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {recentOrders
                    ? "Your latest customer orders"
                    : `Showing ${orders.length} orders`}
                </p>
              </div>
              {recentOrders && orders.length > 0 && (
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                >
                  View all orders
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Table */}
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-surface">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-dark-border">
                  <AnimatePresence>
                    {orders.map((order, index) => {
                      const statusConfig = getStatusConfig(order.order_status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Link href={`/orders/${order.id}`} className="group">
                              <p className="font-medium text-surface-900 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">
                                {order.product.name}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                Order #{order.id.slice(0, 8)}...
                              </p>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 dark:bg-dark-surface text-sm font-semibold text-surface-700 dark:text-surface-300">
                              {order.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-surface-900 dark:text-white">
                              ${order.total_price}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
                              <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
                              <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-surface-900 dark:text-white">
                                {formatDate(order.date_of_order)}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                {formatTime(order.date_of_order)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {order.order_status === "PACKED" && labelUrls[order.id] && (
                                <a
                                  href={labelUrls[order.id]}
                                  target="_blank"
                                  download
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
                                  title="Download Label"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </a>
                              )}
                              <Link
                                href={`/orders/${order.id}`}
                                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                                title="View Details"
                              >
                                <FiExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                <FiPackage className="w-10 h-10 text-surface-400 dark:text-surface-500" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                No orders yet
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-sm mx-auto">
                When customers place orders for your products, they'll appear here.
              </p>
              <Link
                href="/inventory/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-pink text-white font-semibold shadow-premium-sm hover:shadow-premium-md transition-all"
              >
                View Your Products
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
      <Parcel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleParcelSubmit}
      />
    </>
  );
};

export default OrderTable;
