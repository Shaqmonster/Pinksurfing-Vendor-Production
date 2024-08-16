"use client";
import { useState, useEffect, useCallback } from "react";
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

interface Order {
  id: string;
  product: { name: string };
  quantity: number;
  total_price: number;
  order_status: string;
  date_of_order: string;
}

const formatDate = (dateString: string) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  } as any;

  return new Date(dateString).toLocaleString(undefined, options);
};

const OrderTable = () => {
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
    typeof window !== "undefined" ? localStorage.getItem("access") : "";

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
          console.log(orders);
          setOrders(orders.slice(0, 10));
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
      changeStatus(localStorage.getItem("access"), order.id, newStatus).then(
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
        localStorage.getItem("access"),
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
        <Loader />
      ) : (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-primary sm:px-7.5 xl:pb-1">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 pb-4 border-b border-[#eee] dark:border-strokedark">
            All Orders
          </h2>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 border-b border-[#eee] dark:border-strokedark text-left dark:bg-primary font-medium">
                  <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-slate-300 xl:pl-11">
                    Product Name
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-slate-300">
                    Quantity
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-slate-300">
                    Total Price
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-slate-300">
                    Order Status
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-slate-300">
                    Date Of Order
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <Link href={`/orders/${order.id}`}>
                        <h5 className="font-medium text-black dark:text-white">
                          {order.product.name}
                        </h5>
                      </Link>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {order.quantity}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        ${order.total_price}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex flex-col space-y-2">
                        {order.order_status === "PACKED" ||
                        order.order_status === "SHIPPED" ||
                        order.order_status === "DELIVERED" ? (
                          <span className="bg-white dark:bg-primary text-black dark:text-white py-2 px-3 rounded">
                            {order.order_status}
                          </span>
                        ) : (
                          <select
                            className="bg-white dark:bg-primary text-black dark:text-white py-2 px-3 rounded"
                            value={order.order_status}
                            onChange={(e) =>
                              handleStatusChange(order, e.target.value)
                            }
                          >
                            {orderStatuses.map((status, index) => (
                              <option key={index} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                        {order.order_status === "PACKED" &&
                          labelUrls[order.id] && (
                            <a
                              href={labelUrls[order.id]}
                              target="_blank"
                              download
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              Download Label
                            </a>
                          )}
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {formatDate(order.date_of_order)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
