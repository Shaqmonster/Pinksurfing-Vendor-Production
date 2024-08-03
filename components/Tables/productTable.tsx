"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCategories,
  getProducts,
  getSubcategories,
  updateProducts,
} from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { data } from "autoprefixer";
import { deleteProduct } from "@/api/products";
import React from "react";
import Loader from "../common/Loader";
import Link from "next/link";

const ProductsTable = (props: { Products: Product[] }) => {
  const rowRef = useRef<any>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [updateProductData, setUpdateProductData] = useState({});
  const [products, setProducts] = useState(props.Products);
  const [loading, setLoading] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDelete = async (productId: string) => {
    if (typeof window !== "undefined") {
      const token: string | null = localStorage.getItem("access");
      const vendor_id: string | null = localStorage.getItem("vendor_id");

      if (!token || !vendor_id) {
        redirect("/");
        return;
      }

      try {
        const result = await deleteProduct(token, vendor_id, productId);

        if (result && typeof result === "object") {
          if ("error" in result && "message" in result) {
            alert(result.message);
          } else {
            // Product deleted successfully, update local state
            const updatedProducts = products.filter(
              (product) => product.id !== productId
            );
            setProducts(updatedProducts);
            window.location.reload();
          }
        } else {
          console.error("Unexpected result format:", result);
        }
      } catch (error) {
        console.error("Error during product deletion:", error);
      }
    }
  };

  const updateData = (key: string, value: any) => {
    setUpdateProductData((payload: any) => {
      payload[key] = value;
      return payload;
    });
  };
  useEffect(() => {
    console.log(updateProductData);
  }, [updateProductData]);

  const sendUpdate = async () => {
    if (typeof window !== "undefined") {
      let token: string | null = localStorage.getItem("access");
      let vendor_id: string | null = localStorage.getItem("vendor_id");
      let result = await updateProducts(token, vendor_id, updateProductData);
      if (result === false) {
        redirect("/");
      }
      if ("data" in result && "error" in result && "status" in result) {
        let { data, error, status } = result;
        if (error && "message" in result) {
          alert(result?.message);
          return;
        }
        alert(`Success, Update will be reflected soon`);
        window.location.reload();
      }
    }
  };

  const openEditor = (event: any) => {
    let { target } = event;
    console.log(target?.dataset?.id);
    setSelectedKey(target?.dataset?.id);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      getCategories().then((data) => {
        setCategories(data);
        console.log(data);
      });
    }
  }, []);

  useMemo(() => {
    if (typeof window !== "undefined") {
      const token: string | null = localStorage.getItem("access");
      const store: string | null = localStorage.getItem("store");

      if (store) {
        const storeObject = JSON.parse(store);
        const store_name = storeObject.store_name;

        if (token && store_name) {
          setLoading(true);
          getProducts(token, store_name).then((data) => {
            setProducts(data.data.Products);
            setLoading(false);
          });
        }
      }
    }
  }, []);

  useMemo(() => {
    categories.forEach((category, index) => {
      getSubcategories(category.slug).then((data) => {
        setSubcategories(data.data);
      });
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      let filteredCategory = subcategories.filter(
        (i: { slug: string; name: string; category: string }) =>
          i.category === selectedCategory
      );
      setFilteredSubcategories(filteredCategory);
      console.log(filteredCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleFileChange = (event) => {
    const selectedFiles = event?.target?.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  function truncateAndConvertToText(htmlString, maxLength = 40) {
    let truncatedText = htmlString.substring(0, maxLength);
    let tempElement = document.createElement("div");
    tempElement.innerHTML = truncatedText;
    return tempElement.textContent || tempElement.innerText || "";
  }

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-primary">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              All Products
            </h4>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-4 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:bg-red md:px-4 2xl:px-7.5">
            <div className=" flex items-center">
              <p className="font-medium ">Product Image</p>
            </div>
            <div className=" flex items-center">
              <p className="font-medium ">Product Name</p>
            </div>
            <div className=" hidden items-center sm:flex ">
              <p className="font-medium">Category</p>
            </div>
            <div className=" hidden sm:flex items-center ">
              <p className="font-medium pr-2">Description</p>
            </div>
            <div className=" hidden sm:flex items-center  m-auto">
              <p className="font-medium">Stock</p>
            </div>
            <div className=" flex items-center m-auto">
              <p className="font-medium">Price</p>
            </div>
            <div className=" flex items-center">
              <p className="font-medium m-auto">Action</p>
            </div>
          </div>

          {products?.map((product: any, key) => (
            <>
              <div
                className="grid grid-cols-3 sm:grid-cols-7  border-t border-stroke py-4.5 px-4 dark:border-strokedark  2xl:px-7.5"
                key={key}
                data-id={product.id}
              >
                <div className="flex items-center" ref={rowRef}>
                  <div className="flex  gap-4 flex-row items-center">
                    <div className="h-12.5 w-15 rounded-md">
                      <Image
                        src={product.image1}
                        width="56"
                        height="50"
                        className="w-full h-full rounded-md"
                        alt="Product"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-black dark:text-white">
                    {product.name}
                  </p>
                </div>
                <div className=" hidden items-center sm:flex">
                  <p className="text-sm text-black dark:text-white">
                    {product.category}
                    <br />
                    |-
                    {" " + product.subcategory}
                  </p>
                </div>
                <div className=" hidden sm:flex items-center">
                  <p className="text-sm text-black dark:text-white pr-4">
                    {truncateAndConvertToText(product.short_description)}
                  </p>
                </div>
                <div className=" hidden sm:flex items-center m-auto">
                  <p className="text-sm text-black dark:text-white px-4">
                    {product.quantity}
                  </p>
                </div>
                <div className=" flex items-center gap-2 m-auto">
                  <p className="text-sm text-meta-3">${product.unit_price}</p>
                </div>
                <div className=" flex items-center justify-between m-auto">
                  <div className="flex flex-row justify-between">
                    <Link
                      className="hover:bg-amber-200 w-1/2"
                      data-id={product.id}
                      key={key}
                      href={`/inventory/editProduct/${product.id}`}
                    >
                      <svg
                        className="mx-2 pointer-events-none"
                        width="24px"
                        height="24px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5H9C7.11438 5 6.17157 5 5.58579 5.58579C5 6.17157 5 7.11438 5 9V15C5 16.8856 5 17.8284 5.58579 18.4142C6.17157 19 7.11438 19 9 19H15C16.8856 19 17.8284 19 18.4142 18.4142C19 17.8284 19 16.8856 19 15V12M9.31899 12.6911L15.2486 6.82803C15.7216 6.36041 16.4744 6.33462 16.9782 6.76876C17.5331 7.24688 17.5723 8.09299 17.064 8.62034L11.2329 14.6702L9 15L9.31899 12.6911Z"
                          stroke="#3c50e0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                    {/* For Delete */}
                    <svg
                      width="24px"
                      stroke="red"
                      height="24px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="cursor-pointer"
                      onClick={() => handleDelete(product.id)}
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M10.3094 2.25002H13.6908C13.9072 2.24988 14.0957 2.24976 14.2737 2.27819C14.977 2.39049 15.5856 2.82915 15.9146 3.46084C15.9978 3.62073 16.0573 3.79961 16.1256 4.00494L16.2373 4.33984C16.2562 4.39653 16.2616 4.41258 16.2661 4.42522C16.4413 4.90933 16.8953 5.23659 17.4099 5.24964C17.4235 5.24998 17.44 5.25004 17.5001 5.25004H20.5001C20.9143 5.25004 21.2501 5.58582 21.2501 6.00004C21.2501 6.41425 20.9143 6.75004 20.5001 6.75004H3.5C3.08579 6.75004 2.75 6.41425 2.75 6.00004C2.75 5.58582 3.08579 5.25004 3.5 5.25004H6.50008C6.56013 5.25004 6.5767 5.24998 6.59023 5.24964C7.10488 5.23659 7.55891 4.90936 7.73402 4.42524C7.73863 4.41251 7.74392 4.39681 7.76291 4.33984L7.87452 4.00496C7.94281 3.79964 8.00233 3.62073 8.08559 3.46084C8.41453 2.82915 9.02313 2.39049 9.72643 2.27819C9.90445 2.24976 10.093 2.24988 10.3094 2.25002ZM9.00815 5.25004C9.05966 5.14902 9.10531 5.04404 9.14458 4.93548C9.1565 4.90251 9.1682 4.86742 9.18322 4.82234L9.28302 4.52292C9.37419 4.24941 9.39519 4.19363 9.41601 4.15364C9.52566 3.94307 9.72853 3.79686 9.96296 3.75942C10.0075 3.75231 10.067 3.75004 10.3553 3.75004H13.6448C13.9331 3.75004 13.9927 3.75231 14.0372 3.75942C14.2716 3.79686 14.4745 3.94307 14.5842 4.15364C14.605 4.19363 14.626 4.2494 14.7171 4.52292L14.8169 4.82216L14.8556 4.9355C14.8949 5.04405 14.9405 5.14902 14.992 5.25004H9.00815Z"
                        fill="#1C274C"
                      />
                      <path
                        d="M5.91509 8.45015C5.88754 8.03685 5.53016 7.72415 5.11686 7.7517C4.70357 7.77925 4.39086 8.13663 4.41841 8.54993L4.88186 15.5017C4.96736 16.7844 5.03642 17.8205 5.19839 18.6336C5.36679 19.4789 5.65321 20.185 6.2448 20.7385C6.8364 21.2919 7.55995 21.5308 8.4146 21.6425C9.23662 21.7501 10.275 21.7501 11.5606 21.75H12.4395C13.7251 21.7501 14.7635 21.7501 15.5856 21.6425C16.4402 21.5308 17.1638 21.2919 17.7554 20.7385C18.347 20.185 18.6334 19.4789 18.8018 18.6336C18.9638 17.8206 19.0328 16.7844 19.1183 15.5017L19.5818 8.54993C19.6093 8.13663 19.2966 7.77925 18.8833 7.7517C18.47 7.72415 18.1126 8.03685 18.0851 8.45015L17.6251 15.3493C17.5353 16.6971 17.4713 17.6349 17.3307 18.3406C17.1943 19.025 17.004 19.3873 16.7306 19.6431C16.4572 19.8989 16.083 20.0647 15.391 20.1552C14.6776 20.2485 13.7376 20.25 12.3868 20.25H11.6134C10.2626 20.25 9.32255 20.2485 8.60915 20.1552C7.91715 20.0647 7.54299 19.8989 7.26958 19.6431C6.99617 19.3873 6.80583 19.025 6.66948 18.3406C6.52892 17.6349 6.46489 16.6971 6.37503 15.3493L5.91509 8.45015Z"
                        fill="#1C274C"
                      />
                      <path
                        d="M9.42546 10.2538C9.83762 10.2125 10.2052 10.5133 10.2464 10.9254L10.7464 15.9254C10.7876 16.3376 10.4869 16.7051 10.0747 16.7463C9.66256 16.7875 9.29503 16.4868 9.25381 16.0747L8.75381 11.0747C8.7126 10.6625 9.01331 10.295 9.42546 10.2538Z"
                        fill="#1C274C"
                      />
                      <path
                        d="M14.5747 10.2538C14.9869 10.295 15.2876 10.6625 15.2464 11.0747L14.7464 16.0747C14.7052 16.4868 14.3376 16.7875 13.9255 16.7463C13.5133 16.7051 13.2126 16.3376 13.2538 15.9254L13.7538 10.9254C13.795 10.5133 14.1626 10.2125 14.5747 10.2538Z"
                        fill="#1C274C"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className={`${
                  selectedKey !== String(product.id)
                    ? "hidden"
                    : "flex flex-col gap-y-4 border-t box-border border-stroke p-5 dark:border-strokedark 2xl:px-7.5 bg-black items-baseline"
                } duration-300 ease-linear`}
                key={product.id}
                data-id={product.id}
              >
                <p
                  className="absolute right-[50px] font-extrabold text-white font-3xl cursor-pointer"
                  onClick={() => setSelectedKey("")}
                >
                  X
                </p>

                {/* Display selected files */}
                <div className="flex flex-row items-center gap-4 ">
                  {/* File input */}
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`file-input-${product.id}`}
                      multiple
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor={`file-input-${product.id}`}
                      className="cursor-pointer text-white"
                    >
                      Choose file
                    </label>
                  </div>
                  {/* Display selected files */}
                  <div className="flex flex-col justify-start mr-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          X
                        </button>
                      </div>
                    ))}
                    {files.length === 0 && (
                      <span className="text-white">No files selected</span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col gap-4 w-full">
                  <div className="flex-col flex flex-1">
                    <label
                      className="block tracking-wide text-xs font-bold mb-2 text-white"
                      htmlFor="product-title"
                    >
                      Product Title
                    </label>
                    <input
                      id="product-title"
                      type="text"
                      placeholder="Title"
                      defaultValue={product.name}
                      className="w-full rounded border border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary px-4"
                      onChange={(e) => updateData("name", e.target.value)}
                    />
                  </div>
                  <div className="flex-col flex flex-1">
                    <label
                      className="block tracking-wide text-xs font-bold mb-2 text-white"
                      htmlFor="short-description"
                    >
                      Short Description
                    </label>
                    <textarea
                      className="w-full rounded border border-stroke bg-gray py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary px-4"
                      name="short-description"
                      id="short-description"
                      rows={2}
                      placeholder="Describe your product"
                      defaultValue={product.short_description}
                      onChange={(e) =>
                        updateData("short_description", e.target.value)
                      }
                    ></textarea>
                  </div>
                  <div className="flex-col flex flex-1">
                    <label
                      className="block tracking-wide text-xs font-bold mb-2 text-white"
                      htmlFor="product-description"
                    >
                      Product Description
                    </label>
                    <textarea
                      className="w-full rounded border border-stroke bg-gray py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary px-4"
                      name="product-description"
                      id="product-description"
                      rows={2}
                      placeholder="Describe your product"
                      defaultValue={product.description}
                      onChange={(e) =>
                        updateData("description", e.target.value)
                      }
                    ></textarea>
                  </div>
                </div>

                {/* Stock and Price */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  {/* Stock */}
                  <div className="w-full sm:w-40">
                    <label
                      className="block uppercase tracking-wide text-xs font-bold mb-2 text-white"
                      htmlFor="stock"
                    >
                      Stock
                    </label>
                    <input
                      className="w-full rounded border border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="number"
                      name="stock"
                      id="stock"
                      defaultValue={product.quantity}
                      onChange={(e) => updateData("quantity", e.target.value)}
                    />
                  </div>

                  {/* MRP */}
                  <div className="w-full sm:w-40">
                    <label
                      className="block uppercase tracking-wide text-xs font-bold mb-2 text-white"
                      htmlFor="mrp"
                    >
                      Price
                    </label>
                    <input
                      className="w-full rounded border border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="mrp"
                      id="mrp"
                      defaultValue={product.mrp}
                      onChange={(e) => updateData("mrp", e.target.value)}
                    />
                  </div>

                  {/* Checkbox for Discount */}
                  <div className="w-full sm:w-40 flex items-center">
                    <input
                      type="checkbox"
                      id="discount-checkbox"
                      className="mr-2"
                      checked={hasDiscount}
                      onChange={() => setHasDiscount(!hasDiscount)}
                    />
                    <label
                      htmlFor="discount-checkbox"
                      className="text-xs font-bold text-white"
                    >
                      Product has discounts
                    </label>
                  </div>

                  {/* Unit Price */}
                  {hasDiscount && (
                    <div className="w-full sm:w-40">
                      <label
                        className="block uppercase tracking-wide text-xs font-bold mb-2 text-white"
                        htmlFor="unit-price"
                      >
                        Discounted Price
                      </label>
                      <input
                        className="w-full rounded border border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="unit-price"
                        id="unit-price"
                        defaultValue={product.unit_price}
                        onChange={(e) =>
                          updateData("unit_price", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end w-full">
                  <button
                    className="flex justify-center rounded bg-primary py-2 px-6 mr-2 font-medium text-gray hover:bg-opacity-95"
                    onClick={() => {
                      if (!hasDiscount) {
                        updateData("unit_price", product.mrp);
                      }
                      sendUpdate();
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          ))}
        </div>
      )}
    </>
  );
};

export default ProductsTable;
