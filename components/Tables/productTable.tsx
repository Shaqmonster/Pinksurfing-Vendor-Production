"use client";
import Image from "next/image";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { FaEdit, FaTrash } from "react-icons/fa";
import { MyContext } from "@/app/providers/context";

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
  const { sidebarOpen } = useContext(MyContext);

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
      getSubcategories(category?.slug).then((data) => {
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
              {console.log(products)}
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
                    {product.category.name}
                    <br />
                    |-
                    {" " + product.subcategory.name}
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
                      <FaEdit
                        className="mx-2 pointer-events-none"
                        size={24}
                        color="#3c50e0"
                      />
                    </Link>
                    {/* For Delete */}
                    <FaTrash
                      size={24}
                      color="red"
                      className="cursor-pointer"
                      onClick={() => handleDelete(product.id)}
                    />
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
