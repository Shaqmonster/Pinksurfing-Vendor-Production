
"use client"
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { getSingleOrder } from "@/api/products";
import { useRouter } from 'next/router';
import { changeOrderStatus } from "@/api/products";

const Page = ({ params }: { params: { id: string } }) => {
  console.log('Params:', params); // Check the console for debugging

  const { id: orderId } = params;
  console.log('Order ID:', orderId);




  const tokenFromLocalStorage = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
  const [token, setToken] = useState<string | null>(tokenFromLocalStorage);

  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  

  const [orderData, setOrderData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [additionalFields, setAdditionalFields] = useState<string>('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  

  useEffect(() => {
    const fetchSingleorder = async () => {
      try {
        const { data, error } = await getSingleOrder(token, params.id);
        if (!error) {
          console.log('order Data:', data);
          console.log(`order ID: ${params.id}`);
          setOrderData(data['Order Details']);
  
          // Check if the order status is 'shipped'
          const isShipped = data['Order Details']?.order_status?.trim().toUpperCase() === 'SHIPPED';
          
          // Set the showAdditionalFields state accordingly
          setShowAdditionalFields(isShipped);
  
        } else {
          console.error('Error fetching order:', error);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSingleorder();
  }, [token, params.id]);
    
const handleStatusChange = async () => {
  try {
    // Call your API to update order status
    const response = await changeOrderStatus(params.id, selectedStatus || '', additionalFields || ''); // Use selectedStatus || '' and additionalFields || '' to handle null cases

    if (response.error) {
      // Handle error case
      console.error('Failed to update order status');
    } else {
      // Status changed successfully, update UI or navigate to another page
      console.log('Order status updated successfully');

      // If status is set to "shipped," show additional fields
      if (selectedStatus === 'shipped') {
        setShowAdditionalFields(true);
      }
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};



const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedValue = e.target.value;

  // Check if the selected status is not the same as the current status
  if (selectedValue !== selectedStatus) {
    setSelectedStatus(selectedValue);
    // Reset additional fields when the status changes
    setAdditionalFields('');
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
        <h3 className="font-medium text-black dark:text-white">Order Information</h3>
      </div>
      <div className="p-7">
        <form>
          <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="storeName"
                    >
                      Quantity
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="storeName"
                      id="storeName"
                      placeholder="Enter store name"
                      value={orderData?.quantity || ''}
                      // onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="contactPersonName"
                    >
                      Total Price 
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="contactPersonName"
                      id="contactPersonName"
                      value={orderData?.total_price || ''}
                      // value={contactPersonName}
                      // onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="email"
                    >
                      Customer
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="email"
                      name="email"
                      id="email"
                      value={orderData?.customer || ''}
                      // value={email}
                      // onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="phoneNumber"
                    >
                      Product
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={orderData?.product || ''}

                      // value={phoneNumber}
                      // onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter Phone Number"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="street1"
                    >
                      Delivery Address
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="street1"
                      id="street1"
                      value={orderData?.delivery_address || ''}

                      // value={street1}
                      // onChange={(e) => setStreet1(e.target.value)}
                      placeholder="Enter Street 1"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="street2"
                    >
                      Order Date
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="street2"
                      id="street2"
                      value={orderData?.order_date || ''}

                      // value={street2}
                      // onChange={(e) => setStreet2(e.target.value)}
                      placeholder="Enter Street 2"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="orderStatus"
                    >
                      Order Status
                    </label>
                    <select
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      name="orderStatus"
                      id="orderStatus"
                      value={selectedStatus || ''}
                      onChange={handleStatusSelect}
                      disabled={selectedStatus === 'shipped'}
                    >
                      {selectedStatus === 'received' && (
                        <>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                        </>
                      )}
                      {selectedStatus === 'packed' && <option value="shipped">Shipped</option>}
                      <option value="shipped" disabled={selectedStatus === 'shipped'}>
                        Shipped
                      </option>
                    </select>
                  </div>

                  {showAdditionalFields && (
                    <>
                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="productWeight"
                        >
                          Product Weight
                        </label>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="productWeight"
                          id="productWeight"
                          value={orderData?.product_weight || ''}
                          placeholder="Enter product weight"
                        />
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="productWidth"
                        >
                          Product Width
                        </label>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="productWidth"
                          id="productWidth"
                          value={orderData?.product_width || ''}
                          placeholder="Enter product width"
                        />
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="productHeight"
                        >
                          Product Height
                        </label>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="productHeight"
                          id="productHeight"
                          value={orderData?.product_height || ''}
                          placeholder="Enter product height"
                        />
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="additionalInfo"
                        >
                          Additional Information
                        </label>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="additionalInfo"
                          id="additionalInfo"
                          value={additionalFields}
                          onChange={(e) => setAdditionalFields(e.target.value)}
                          placeholder="Enter additional information"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    className="bg-primary text-white py-2 px-6 rounded-full"
                    onClick={handleStatusChange}
                    disabled={!selectedStatus || selectedStatus !== 'shipped'}
                  >
                    Change Status
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default Page;
