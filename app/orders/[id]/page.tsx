"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getSingleOrder, changeOrderStatus } from "@/api/products";
import { toast } from "react-toastify";
import { buyShipmentLabel, getParcelDetails } from "@/api/orders";

const Page = ({ params }: { params: { id: string } }) => {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("access") : null
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
  const [parcelId,setParcelId] = useState<string | null>(null);
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
    if (!selectedStatus) return;
    setSelectedStatus("PACKED");
    try {
      const response = await changeOrderStatus(
        token,
        params.id,
        selectedStatus,
        additionalFields
      );
      if (response.error) {
        console.error("Failed to update order status:", response.error);
      } else {
        console.log("Order status updated successfully", response.data);
        setOrderData((prevData: any) => ({
          ...prevData,
          order_status: selectedStatus
        }));
        toast.success(response.data.Success);
        await getParcelId();
        setShowShipmentButton(true);
        if (selectedStatus === "shipped") {
          setShowAdditionalFields(true);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };
  const getParcelId = async () => {
    try {
      const response = await getParcelDetails(params.id,token);
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
    if(!parcelId) return;
    try {
      const response = await buyShipmentLabel(parcelId, token);
      console.log(response);
      if (response.error) {
        toast.error("Failed to buy shipment label:");
        console.error("Failed to buy shipment label:", response.error);
      } else {
        console.log("Shipment label bought successfully", response.data);
        toast.success(response.data.Success);
      }
    } catch (error) {
      console.error("Error buying shipment label:", error);
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
                        customer
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
                        Order Status : {orderData?.order_status}
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
                        {
                          orderData?.order_status === "RECEIVED" && (
                            <p>
                              Payment Completed
                            </p>
                          )
                        }
                      </label>
                    </div>
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

                    {/* {showAdditionalFields && (
                      <div className="mb-5.5">
                        <label className="mb-3 block text-sm font-medium">
                          Additional Information
                        </label>
                        <input
                          className="w-full rounded border bg-gray py-3 px-4.5 text-black dark:bg-meta-4"
                          type="text"
                          value={additionalFields}
                          onChange={(e) => setAdditionalFields(e.target.value)}
                          placeholder="Enter additional information"
                        />
                      </div>
                    )} */}
                    {showShipmentButton &&  orderData?.order_status =="PACKED"  && (
                      <button
                        type="button"
                        className={`bg-primary text-white py-2 px-6 rounded-full block mb-4`}
                        onClick={handleBuyShipmentLabel}
                      >
                        Buy Shipment Label
                      </button>
                    )}
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
                      // disabled={
                      //   !selectedStatus ||
                      //   selectedStatus === orderData?.order_status
                      // }
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
