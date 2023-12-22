"use client"
import { getOrders } from "@/api/orders";
import { Package } from "@/types/package";
import Link from 'next/link';

import { useMemo, useState, useEffect } from "react";

import { getAllOrders } from "@/api/products";
import { redirect } from "next/navigation";


const packageData: Package[] = [
  {
    name: "Free package",
    price: 0.0,
    invoiceDate: `Jan 13,2023`,
    status: "Paid",
  },
  {
    name: "Standard Package",
    price: 59.0,
    invoiceDate: `Jan 13,2023`,
    status: "Paid",
  },
  {
    name: "Business Package",
    price: 99.0,
    invoiceDate: `Jan 13,2023`,
    status: "Unpaid",
  },
  {
    name: "Standard Package",
    price: 59.0,
    invoiceDate: `Jan 13,2023`,
    status: "Pending",
  },
];

const allorders = async () => {
  if (typeof window !== "undefined") {
    const token: string | null = localStorage.getItem("access");
    if (!token) {
      redirect("/");
      return;
    }

    try {
      console.log("Token:", token);

      const result = await getAllOrders(token);

      console.log("API Result:", result);

      if (result && typeof result === "object") {
        if ("error" in result && "message" in result) {
          alert(result.message);
        } else {
          console.log("Orders data:", result.data);
        }
      } else {
        console.error("Unexpected result format:", result);
      }
    } catch (error) {
      console.error("Error fetching Orders:", error);
    }
  }
};

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
  const [orders, setOrders] = useState([])

  let vendor_id: string | null = "";
  if (typeof window !== 'undefined') {
    vendor_id = localStorage.getItem('access');
  }

  useMemo(() => {
    getOrders(vendor_id)
      .then((data: any) => {
        if (typeof data === 'object' && 'data' in data && "Order Request" in data.data) {
          let orders = data.data["Order Request"];
          console.log(orders)
          if (typeof orders == 'object' && orders.length) {
            let slicedData = orders.slice(0, 10);
            setOrders(slicedData)
          }
        }
      })
  }, [vendor_id])
  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Order status changed to: ${newStatus} for order ID: ${orderId}`);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Product Name
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Quantity
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Total Price
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Order Status
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
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
                  <p className="text-black dark:text-white">{order.quantity}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">${order.total_price}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center justify-between">
                    <p className="text-black dark:text-white">{order.order_status}</p>
                    {/* {order.order_status === 'RECIEVED' && (
                      <select
                        className="ml-2"
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value={"Change Status"}>{"Change Status"}</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="PACKED">Packed</option>
                      </select>
                    )} */}
                  </div>
                </td>

                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{formatDate(order.date_of_order)}</p>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
