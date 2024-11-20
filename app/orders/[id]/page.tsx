"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getSingleOrder, changeOrderStatus } from "@/api/products";

const Page = ({ params }: { params: { id: string } }) => {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("access") : null
  );
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [additionalFields, setAdditionalFields] = useState<string>("");
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  useEffect(() => {
    const fetchSingleOrder = async () => {
      try {
        const { data, error } = await getSingleOrder(token, params.id);
        if (!error) {
          setOrderData(data["Order Details"]);
          const isShipped =
            data["Order Details"]?.order_status?.trim().toUpperCase() ===
            "SHIPPED";
          setShowAdditionalFields(isShipped);
        } else {
          console.error("Error fetching order:", error);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleOrder();
  }, [token, params.id]);

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue !== selectedStatus) {
      setSelectedStatus(selectedValue);
      setAdditionalFields(""); // Reset additional fields when the status changes
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === orderData?.order_status) return;

    try {
      const response = await changeOrderStatus(
        params.id,
        selectedStatus,
        additionalFields
      );

      if (response.error) {
        console.error("Failed to update order status:", response.error);
      } else {
        console.log("Order status updated successfully");
        setOrderData((prevData: any) => ({
          ...prevData,
          order_status: selectedStatus,
        }));

        if (selectedStatus === "shipped") {
          setShowAdditionalFields(true);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Order Information" />

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Order Information
                </h3>
              </div>
              <div className="p-7">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <form>
                    {/* Order Details */}
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Quantity
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                        type="text"
                        value={orderData?.quantity || ""}
                        readOnly
                      />
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Total Price
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                        type="text"
                        value={orderData?.total_price || ""}
                        readOnly
                      />
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Order Status
                      </label>
                      <select
                        className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                        value={selectedStatus || orderData?.order_status || ""}
                        onChange={handleStatusSelect}
                        disabled={orderData?.order_status === "shipped"}
                      >
                        <option value="" disabled>
                          Select a status
                        </option>
                        {orderData?.order_status === "received" && (
                          <option value="packed">Packed</option>
                        )}
                        {orderData?.order_status === "packed" && (
                          <option value="shipped">Shipped</option>
                        )}
                      </select>
                    </div>

                    {showAdditionalFields && (
                      <div className="mb-5.5">
                        <label className="mb-3 block text-sm font-medium">
                          Additional Information
                        </label>
                        <input
                          className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                          type="text"
                          value={additionalFields}
                          onChange={(e) =>
                            setAdditionalFields(e.target.value)
                          }
                          placeholder="Enter additional information"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      className={`bg-primary text-white py-2 px-6 rounded-full ${
                        (!selectedStatus ||
                          selectedStatus === orderData?.order_status) &&
                        "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={handleStatusChange}
                      disabled={
                        !selectedStatus ||
                        selectedStatus === orderData?.order_status
                      }
                    >
                      Change Status
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
