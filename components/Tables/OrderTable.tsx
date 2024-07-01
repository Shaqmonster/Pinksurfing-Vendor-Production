"use client";
import { getOrders } from "@/api/orders";
import { Package } from "@/types/package";
import Link from "next/link";

import { useMemo, useState } from "react";
import Loader from "../common/Loader";

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  let vendor_id: string | null = "";
  if (typeof window !== "undefined") {
    vendor_id = localStorage.getItem("access");
  }

  useMemo(() => {
    setLoading(true);
    getOrders(vendor_id).then((data: any) => {
      if (
        typeof data === "object" &&
        "data" in data &&
        "Order Request" in data.data
      ) {
        setLoading(false);
        let orders = data.data["Order Request"];
        console.log(orders);
        if (typeof orders == "object" && orders.length) {
          let slicedData = orders.slice(0, 10);
          setOrders(slicedData);
        }
      }
    });
  }, [vendor_id]);

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
                {orders.map((order: any, key) => (
                  <tr key={key}>
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
                      <div className="flex items-center justify-between">
                        <p className="text-black dark:text-white">
                          {order.order_status}
                        </p>
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
    </>
  );
};

export default OrderTable;
