"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCategories,
  getProducts,
  getSubcategories,
} from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { deleteProduct } from "@/api/products";
import React from "react";
import Loader from "../common/Loader";
import Link from "next/link";
import { FaEdit, FaTrash } from "react-icons/fa";
import ConfirmationModal from "../Modals/ConfirmDelete";
import { toast } from "react-toastify";

const ProductsTable = (props: { Products: Product[] }) => {
  const rowRef = useRef<any>(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [updateProductData, setUpdateProductData] = useState({});
  const [products, setProducts] = useState(props.Products);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState("");

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
            const updatedProducts = products.filter(
              (product) => product.id !== productId
            );
            setProducts(updatedProducts);
            toast.success("Product deleted successfully!");
            closeDeleteModal();
          }
        } else {
          console.error("Unexpected result format:", result);
        }
      } catch (error) {
        console.error("Error during product deletion:", error);
      }
    }
  };

  useEffect(() => {
    console.log(updateProductData);
  }, [updateProductData]);

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
        const store_slug = storeObject.slug;
        console.log("Store Name:", storeObject);
        if (token && store_slug) {
          setLoading(true);
          getProducts(token, store_slug).then((data) => {
            setProducts(data.data.Products);
            setLoading(false);
          });
        }
      }
    }
  }, []);

  useMemo(() => {
    categories.forEach((category : any, index) => {
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

  function truncateAndConvertToText(htmlString : any, maxLength = 40) {
    let truncatedText = htmlString.substring(0, maxLength);
    let tempElement = document.createElement("div");
    tempElement.innerHTML = truncatedText;
    return tempElement.textContent || tempElement.innerText || "";
  }

  const openDeleteModal = (productId : any) => {
    setProductIdToDelete(productId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setProductIdToDelete("");
  };

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
                      <img
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
                    {product?.category?.name}
                    <br />
                    |-
                    {" " + product?.subcategory?.name}
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
                      onClick={() => openDeleteModal(product.id)}
                    />
                  </div>
                </div>
              </div>
            </>
          ))}
          <ConfirmationModal
            isOpen={isModalOpen}
            onClose={closeDeleteModal}
            onConfirm={() => handleDelete(productIdToDelete)}
          />
        </div>
      )}
    </>
  );
};

export default ProductsTable;