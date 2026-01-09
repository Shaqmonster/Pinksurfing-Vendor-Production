"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getSingleOrder, changeOrderStatus } from "@/api/products";
import { toast } from "react-toastify";
import {
  buyShipmentLabel,
  getParcelDetails,
  getShipmentDetails
} from "@/api/orders";
import { fail } from "assert";
import { getCookie } from "@/utils/cookies";
const Page = ({ params }: { params: { id: string } }) => {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? getCookie("access_token") : null
  );
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [additionalFields, setAdditionalFields] = useState({
    length: "",
    width: "",
    height: "",
    weight: ""
  });
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [showShipmentButton, setShowShipmentButton] = useState(false);
  const [parcelId, setParcelId] = useState<string | null>(null);
  const [showDownloadShipmentLabel, setShowDownloadShipmentLabel] =
    useState(false);
    const [orderStatus , setOrderStatus] = useState<string | null>(null);
  useEffect(() => {
    const fetchSingleOrder = async () => {
      try {
        const { data, error } = await getSingleOrder(token, params.id);
        if (!error) {
          setOrderData(data["Order Details"]);
          setOrderStatus(data["Order Details"]?.order_status);
          console.log(data["Order Details"]);
          const isShipped =
            data["Order Details"]?.order_status?.trim().toUpperCase() ===
            "SHIPPED";
          setShowAdditionalFields(isShipped);
          setSelectedStatus(data["Order Details"]?.order_status);
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
      setAdditionalFields({
        length: "",
        width: "",
        height: "",
        weight: ""
      }); // Reset additional fields when the status changes
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status to proceed.");
      return;
    }

    // Temporarily update status while processing
    setSelectedStatus("PACKED");
    setOrderStatus("PACKED");
    try {
      const response = await changeOrderStatus(
        token,
        params.id,
        "PACKED",
        additionalFields
      );

      // Assuming `response` contains a success message or updated data
      toast.success("Order status updated successfully!");
      console.log("Order status updated successfully", response);

      // Update the local order data state
      setOrderData((prevData: any) => ({
        ...prevData,
        order_status: selectedStatus
      }));

      // Perform additional actions after status change
      if (selectedStatus === "shipped") {
        setShowAdditionalFields(true);
      }

      await getParcelId();
      setShowShipmentButton(true);
    } catch (error: any) {
      // Handle errors gracefully
      setOrderStatus("RECEIVED");
      toast.error(error.message || "Failed to update order status.");
      console.error("Error updating order status:", error);
    }
  };

  const getParcelId = async () => {
    try {
      const response = await getParcelDetails(params.id, token);
      if (response.error) {
        toast.error("Failed to get parcel details:");
        console.error("Failed to get parcel details:", response.error);
      } else {
        setParcelId(response.data.parcel_id);
        console.log("Parcel details fetched successfully", response.data);
        toast.success(response.data.Success);
      }
    } catch (error) {
      console.error("Error getting parcel details:", error);
    }
  };
  const handleBuyShipmentLabel = async () => {
    console.log("Buying shipment label for parcel:", parcelId);

    if (!parcelId) {
      toast.error("Parcel ID is missing!");
      return;
    }

    try {
      const response = await buyShipmentLabel(parcelId, token);

      if (response.error) {
        // Display error message from response
        toast.error(response.message || "Failed to buy shipment label.");
        console.error("Failed to buy shipment label:", response);
      } else {
        // Handle success response
        console.log("Shipment label bought successfully", response.data);
        toast.success("Order Marked as Shipped!");
        setShowDownloadShipmentLabel(true);
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error("Error buying shipment label:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const downloadShipmentLabel = async () => {
    const orderId = orderData?.id;
    console.log("Downloading shipment label for order:", orderId);
    if (!orderId) {
      toast.error("Order ID is missing!");
      return;
    }

    try {
      const response = await getShipmentDetails(orderId, token);

      if (response.postage_label_url) {
        // Use our API route to proxy the download (bypasses CORS)
        const proxyUrl = `/api/download-label?url=${encodeURIComponent(response.postage_label_url)}&filename=shipment_label_${orderId}.png`;
        
        const link = document.createElement("a");
        link.href = proxyUrl;
        link.download = `shipment_label_${orderId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Shipment label Will be downloaded shortly!");
        console.log("Shipment label downloaded successfully", response);
      } else {
        toast.error("Postage label URL not found in the response.");
        console.error("Postage label URL not found in the response:", response);
      }
    } catch (error) {
      toast.error("Failed to download shipment label.");
      console.error("Error downloading shipment label:", error);
    }
  };
  useEffect(() => {
    if (orderData?.order_status === "PACKED") {
      getParcelId();
      setShowShipmentButton(true);
    }
  }, [orderData]);
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
                        Order Id
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.id || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Quantity
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
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
                        className="w-full rounded border bg-gray py-3 px-4.5  dark:bg-meta-4"
                        type="text"
                        value={orderData?.total_price || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Customer Name
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.customer_name || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Customer Email
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.customer || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Customer Mobile Number
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.phone || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        product
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.product || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        delivery_address
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.delivery_address || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        order_date
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                        type="text"
                        value={orderData?.order_date || ""}
                        readOnly
                      />
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        vendor
                      </label>
                      <input
                        className="w-full rounded border bg-gray py-3 px-4.5  dark:bg-meta-4"
                        type="text"
                        value={orderData?.vendor || ""}
                        readOnly
                      />
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        Order Status : {orderStatus}
                      </label>
                      {/* <select
                        className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                        value={selectedStatus || orderData?.order_status || ""}
                        onChange={handleStatusSelect}
                        disabled={orderData?.order_status === "shipped".toUpperCase()}
                      >
                        <option value="" disabled>
                          Select a status
                        </option>
                        {orderData?.order_status === "received".toUpperCase() && (
                          <option value="packed">Packed</option>
                        )}
                        {orderData?.order_status === "packed".toUpperCase() && (
                          <option value="shipped">Shipped</option>
                        )}
                      </select> */}
                    </div>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium">
                        {orderData?.order_status === "RECEIVED" && (
                          <p>Payment Completed</p>
                        )}
                      </label>
                    </div>
                    {orderData?.order_status === "RECEIVED" &&
                      !(
                        showShipmentButton ||
                        orderData?.order_status == "PACKED"
                      ) && (
                        <>
                          <div className="mb-5.5">
                            <label className="mb-3 block text-sm font-medium">
                              Length
                            </label>
                            <input
                              className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                              type="text"
                              value={additionalFields.length || ""}
                              onChange={(e) =>
                                setAdditionalFields((prev: any) => ({
                                  ...prev,
                                  length: e.target.value
                                }))
                              }
                              placeholder="Enter length"
                            />
                          </div>
                          <div className="mb-5.5">
                            <label className="mb-3 block text-sm font-medium">
                              Width
                            </label>
                            <input
                              className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                              type="text"
                              value={additionalFields.width || ""}
                              onChange={(e) =>
                                setAdditionalFields((prev: any) => ({
                                  ...prev,
                                  width: e.target.value
                                }))
                              }
                              placeholder="Enter width"
                            />
                          </div>
                          <div className="mb-5.5">
                            <label className="mb-3 block text-sm font-medium">
                              Height
                            </label>
                            <input
                              className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                              type="text"
                              value={additionalFields.height || ""}
                              onChange={(e) =>
                                setAdditionalFields((prev: any) => ({
                                  ...prev,
                                  height: e.target.value
                                }))
                              }
                              placeholder="Enter height"
                            />
                          </div>
                          <div className="mb-5.5">
                            <label className="mb-3 block text-sm font-medium">
                              Weight
                            </label>
                            <input
                              className="w-full rounded border bg-gray py-3 px-4.5 dark:bg-meta-4"
                              type="text"
                              value={additionalFields.weight || ""}
                              onChange={(e) =>
                                setAdditionalFields((prev: any) => ({
                                  ...prev,
                                  weight: e.target.value
                                }))
                              }
                              placeholder="Enter weight"
                            />
                          </div>
                          <button
                            type="button"
                            className={`bg-primary text-white py-2 px-6 rounded-full ${
                              (!selectedStatus ||
                                !additionalFields.length ||
                                !additionalFields.width ||
                                !additionalFields.height ||
                                !additionalFields.weight) &&
                              "opacity-50 cursor-not-allowed"
                            }`}
                            onClick={handleStatusChange}
                          >
                            Product Packed
                          </button>
                        </>
                      )}
                    {(showShipmentButton ||
                      orderData?.order_status == "PACKED") &&
                      !(orderData?.order_status == "SHIPPED" ||
                        showDownloadShipmentLabel) && (
                        <button
                          type="button"
                          className={`bg-primary text-white py-2 px-6 rounded-full block mb-4`}
                          onClick={handleBuyShipmentLabel}
                        >
                          Mark as Shipped
                        </button>
                      )}
                    
                    {(orderData?.order_status == "SHIPPED" ||
                      showDownloadShipmentLabel) && (
                      <button
                        type="button"
                        className={`bg-primary text-white py-2 px-6 rounded-full`}
                        onClick={downloadShipmentLabel}
                      >
                        Download Shipment Label
                      </button>
                    )}
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
