"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getCategories,
  getSingleProduct,
  getSubcategories,
  updateProducts,
} from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/common/Loader";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

export default function EditProduct({ params }: { params: { id: string } }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [allowedAttributes, setAllowedAttributes] = useState([]);
  const [files, setFiles] = useState<File[]>([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );
  const [attribute, setAttribute] = useState([
    {
      name: "",
      value: "",
      additional_price: 0,
    },
  ]);

  interface ProductData {
    name: string;
    unit_price: string;
    mrp: string;
    category: string;
    brand_name: string;
    subcategory: string;
    tags: string;
    meta_title: string;
    length: string;
    width: string;
    height: string;
    weight: string;
    quantity: string;
    short_description: string;
    description: string;
    image: string;
    id: string;
  }

  const [productData, setProductData] = useState<ProductData>({
    name: "",
    unit_price: "",
    mrp: "",
    category: "",
    subcategory: "",
    brand_name: "",
    tags: "",
    meta_title: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    quantity: "",
    short_description: "",
    description: "",
    image: "",
    id: "",
  });

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "color",
    "clean",
  ];

  const notifySuccess = (success: string) => toast.success(success);
  const notifyError = (message: string) => toast.error(`Error: ${message}`);

  useMemo(() => {
    getCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getSubcategories(selectedCategory).then((data) => {
        setSubcategories(data.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      setLoading(true);
      getSingleProduct(token, params.id).then((data) => {
        setLoading(false);
        console.log("Fetched Product:", data.data.Products);
        setAttribute(data.data.Products.attributes);
        setProductData(data.data.Products);
        setSelectedCategory(data.data.Products.category);
        setHasDiscount(!!data.data.Products.unit_price);
      });
    } else {
      notifyError("No access token found");
    }
  }, [params.id]);

  const updateSubCategory = (value: string) => {
    setSelectedCategory(value);
    console.log(value);
  };

  const updateProductData = (
    key: keyof Product | "brand_name",
    value: string | number | File[]
  ) => {
    setProductData((data: any) => {
      let returnable = { ...data };
      if (key === "image" && Array.isArray(value)) {
        returnable[key] = value;
      } else {
        returnable[key] = value.toString();
      }

      console.log(returnable);
      return returnable;
    });
  };

  const updateFile = (fileData: File) => {
    setFiles((prevFiles) => [...prevFiles, fileData]);
    updateProductData("image", [...files, fileData]);
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    updateProductData(
      "image",
      files.filter((_, i) => i !== index)
    );
  };

  const handleSave = async () => {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem("access");
      let vendor_id = localStorage.getItem("vendor_id");
      const { mrp, unit_price } = productData;
      const finalUnitPrice = hasDiscount ? unit_price : mrp;
      const updatedProductData = {
        ...productData,
        unit_price: finalUnitPrice,
        attributes: attribute,
      };
      console.log(updatedProductData);
      setLoading(true);
      try {
        const res = await updateProducts(
          token,
          vendor_id,
          updatedProductData,
          files
        );
        console.log(res);
        setLoading(false);
        if (res.error) {
          notifyError(res.message || "Error adding product");
        } else {
          console.log(res);
          notifySuccess(res.data.Status);
        }
      } catch (error) {
        notifyError(error.message || "Unexpected error occurred");
        setLoading(false);
      }
    }
  };

  const removeProductImage = (imageKey) => {
    const updatedProductData = { ...productData };
    delete updatedProductData[`image${imageKey}`];
    setProductData(updatedProductData);
  };

  return (
    <div className="mx-auto max-w-270">
      {loading ? (
        <Loader />
      ) : (
        <form onSubmit={handleSave} className="">
          <div className="flex justify-between border-b border-gray-200 pb-3 mb-6">
            <h1 className="w-full font-semibold text-black dark:text-white text-xl">
              Edit Product
            </h1>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="w-full lg:w-1/2">
              <div className="border-none rounded-md p-5 w-full border bg-white shadow-default dark:bg-primary">
                <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
                  Category
                </h3>
                <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label
                      className="block uppercase tracking-wide text-xs font-bold mb-2"
                      htmlFor="grid-state"
                    >
                      Category
                    </label>
                    <div className="relative">
                      <select
                        className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 dark:bg-[#e7e0ec] dark:border-none dark:text-black"
                        id="grid-state"
                        onChange={(e) => {
                          updateSubCategory(e.target.value);
                          updateProductData("category", e.target?.value);
                        }}
                      >
                        <option value="0">Choose</option>
                        {categories.length
                          ? categories.map(
                              (cat: { slug: string; name: string }, index) => {
                                return (
                                  <option key={index} value={cat.slug}>
                                    {cat.name}
                                  </option>
                                );
                              }
                            )
                          : null}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label
                      className="block uppercase tracking-wide text-xs font-bold mb-2"
                      htmlFor="grid-state"
                    >
                      Subcategory
                    </label>
                    <div className="relative">
                      <select
                        className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 dark:bg-[#e7e0ec] dark:border-none dark:text-black"
                        id="grid-state"
                        onChange={(e: any) => {
                          const selectedSlug = e.target.value;
                          setSelectedSubcategory(selectedSlug);
                          updateProductData("subcategory", selectedSlug);

                          const selectedSubcat = subcategories.find(
                            (subcat) => subcat.slug === selectedSlug
                          );

                          if (selectedSubcat) {
                            console.log(selectedSubcat);
                            setAllowedAttributes(
                              selectedSubcat?.allowed_attributes
                            );
                            const initialAttributes =
                              selectedSubcat?.allowed_attributes?.map(
                                (attr) => ({
                                  name: attr.name,
                                  value: "",
                                  additional_price: 0,
                                })
                              );
                            console.log(initialAttributes);
                            setAttribute(initialAttributes);
                          } else {
                            setAllowedAttributes([]);
                            setAttribute([]);
                          }
                        }}
                      >
                        <option value="0">Choose</option>
                        {subcategories.length && selectedCategory ? (
                          subcategories.map(
                            (
                              cat: {
                                slug: string;
                                name: string;
                                category: string;
                              },
                              index
                            ) => {
                              return (
                                <option key={index} value={cat.slug}>
                                  {cat.name}
                                </option>
                              );
                            }
                          )
                        ) : (
                          <option value="">None</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-none rounded-md p-5 border bg-white shadow-default dark:bg-primary mt-2">
                {/* <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
                Basic
              </h3> */}
                <div className="w-full pt-2">
                  <label
                    className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                    htmlFor="Name"
                  >
                    Title
                    <span className="text-red-500 text-[24px]">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                    type="text"
                    name="Name"
                    id="Name"
                    placeholder="Product Title"
                    value={productData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProductData("name", e.target?.value)
                    }
                    required
                  />
                </div>
                <div className="w-full pt-6">
                  <label
                    className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                    htmlFor="description"
                  >
                    Short Description
                    <span className="text-red-500 text-[24px]">*</span>
                  </label>
                  <ReactQuill
                    className="rounded border-gray-300 dark:border-none py-2 px-3 text-black dark:bg-[#e7e0ec] min-h-[150px]"
                    theme="snow"
                    value={productData.short_description}
                    formats={formats}
                    onChange={(e) => {
                      if (e.length <= 300) {
                        setProductData({
                          ...productData,
                          short_description: e,
                        });
                      }
                    }}
                  />
                  <div className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    {productData.short_description.length}/300 characters
                  </div>
                </div>
                <div className="w-full pt-6">
                  <label
                    className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                    htmlFor="BrandName"
                  >
                    Brand Name
                    <span className="text-red-500 text-[24px]">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                    type="text"
                    name="BrandName"
                    id="BrandName"
                    placeholder="Brand Name"
                    value={productData.brand_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProductData("brand_name", e.target?.value)
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-5.5 sm:flex-row pt-6">
                  <div className="w-full">
                    <label
                      className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="MRP"
                    >
                      Price
                      <span className="text-red-500 text-[24px]">*</span>
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                      type="number"
                      name="mrp"
                      id="mrp"
                      placeholder="Price"
                      value={productData.mrp}
                      onChange={(e) => updateProductData("mrp", e.target.value)}
                      required
                    />
                  </div>
                  {hasDiscount && (
                    <div className="w-full mt-1">
                      <label
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                        htmlFor="Unit Price"
                      >
                        Discounted Price
                      </label>
                      <input
                        className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                        type="number"
                        name="price"
                        id="price"
                        placeholder="Discounted Price"
                        value={productData.unit_price}
                        onChange={(e) =>
                          updateProductData("unit_price", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="mb-5.5">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={hasDiscount}
                      onChange={(e) => setHasDiscount(e.target.checked)}
                    />
                    Product has discounts
                  </label>
                </div>
                <div className="w-full pt-6">
                  <label
                    className="block uppercase tracking-wide text-xs font-bold mb-2"
                    htmlFor="grid-state"
                  >
                    Stock
                    <span className="text-red-500 text-[24px]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                      type="number"
                      name="stock"
                      placeholder="0"
                      id="stock"
                      value={productData.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProductData("quantity", e.target?.value)
                      }
                      required
                    />
                  </div>
                </div>
                <div className="w-full pt-6">
                  <label
                    className="mb-3 block text-sm font-medium text-black dark:text-white"
                    htmlFor="description"
                  >
                    Long Description
                  </label>
                  <ReactQuill
                    className="rounded border border-gray-300 dark:border-none py-2 px-3 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary min-h-[150px]"
                    theme="snow"
                    value={productData.description}
                    formats={formats}
                    onChange={(textValue) =>
                      setProductData({
                        ...productData,
                        description: textValue,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="border-none rounded-md p-5 w-full border bg-white shadow-default dark:bg-primary">
                <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
                  Product Image
                </h3>
                <div className="p-7 bg-gray-2 mb-5">
                  <form action="#" className="relative">
                    <h2 className="font-medium text-gray-700 text-center dark:text-black">
                      Upload Product Image.
                    </h2>
                    <div className="flex flex-col items-center justify-center space-y-3">
                      {/* Render product images from productData */}
                      {productData.image1 && (
                        <div className="relative">
                          <img
                            src={productData.image1}
                            alt="Product Image 1"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(1)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                          >
                            X
                          </button>
                        </div>
                      )}
                      {productData.image2 && (
                        <div className="relative">
                          <img
                            src={productData.image2}
                            alt="Product Image 2"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(2)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                          >
                            X
                          </button>
                        </div>
                      )}
                      {productData.image3 && (
                        <div className="relative">
                          <img
                            src={productData.image3}
                            alt="Product Image 3"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(3)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                          >
                            X
                          </button>
                        </div>
                      )}
                      {productData.image4 && (
                        <div className="relative">
                          <img
                            src={productData.image4}
                            alt="Product Image 4"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(4)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                          >
                            X
                          </button>
                        </div>
                      )}

                      {/* Input for selecting files */}
                      <label>
                        <span className="text-primary cursor-pointer">
                          Click to upload
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const selectedFiles = event?.target?.files;
                            if (selectedFiles) {
                              if (selectedFiles.length + files.length > 4) {
                                toast.error("Cannot upload more than 4 images");
                                return;
                              }
                              const newFiles = Array.from(selectedFiles);
                              newFiles.forEach((file) => updateFile(file));
                            }
                          }}
                          multiple
                        />
                      </label>

                      {/* Display file names if files are selected */}
                      {files.length > 0 ? (
                        files.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="h-20 w-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ))
                      ) : (
                        <>
                          <p className="mt-1.5">SVG, PNG, JPG, or GIF</p>
                          <p>(max, 800 X 800px)</p>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              </div>
              <div className="border-none rounded-md p-5 w-full border bg-white shadow-default dark:bg-primary mt-6">
                <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
                  Meta
                </h3>
                <div className="w-full">
                  <label
                    className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                    htmlFor="Title"
                  >
                    Meta Title
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                    type="text"
                    name="meta_title"
                    id="meta_title"
                    placeholder="Meta Title"
                    value={productData.meta_title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProductData("meta_title", e.target?.value)
                    }
                  />
                </div>
                <div className="w-full mt-6">
                  <label
                    className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                    htmlFor="Tags"
                  >
                    Meta Tags
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                    type="text"
                    name="tags"
                    id="tags"
                    placeholder="Tags seperated by spaces"
                    value={productData.tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProductData("tags", e.target?.value)
                    }
                  />
                </div>
              </div>
              <div className="border-none rounded-md p-5 w-full border bg-white shadow-default dark:bg-primary mt-6">
                <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
                  Dimensions
                </h3>
                <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label
                      className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="Title"
                    >
                      Length
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                      type="text"
                      name="length"
                      id="length"
                      placeholder="Length"
                      value={productData.length}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProductData("length", e.target?.value)
                      }
                    />
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label
                      className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="Tags"
                    >
                      Width
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                      type="text"
                      name="width"
                      id="width"
                      value={productData.width}
                      placeholder="Width"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProductData("width", e.target?.value)
                      }
                    />
                  </div>
                </div>
                <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label
                      className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="Title"
                    >
                      Height
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                      type="text"
                      name="height"
                      id="height"
                      placeholder="Height"
                      value={productData.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProductData("height", e.target?.value)
                      }
                    />
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label
                      className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="Tags"
                    >
                      Weight
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                      type="text"
                      name="weight"
                      id="weight"
                      value={productData.weight}
                      placeholder="Weight"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProductData("weight", e.target?.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-none rounded-md p-5 w-full border bg-white shadow-default dark:bg-primary mt-6">
            <h3 className="w-full font-medium text-black dark:text-white border-b border-gray-200 pb-3 mb-5">
              Attribute
            </h3>
            <div className="col-span-3 row-span-2 flex flex-col justify-between gap-2">
              <label
                className="block uppercase tracking-wide text-xs font-bold mb-2 text-black dark:text-white"
                htmlFor="grid-state"
              >
                Variants 'different sizes of the same or main item for sale'
              </label>
              {attribute.map((singleAttribute, j) => {
                return (
                  <React.Fragment key={j}>
                    <div
                      className="col-span-4 flex justify-between gap-2"
                      key={j}
                    >
                      <input
                        className="w-10 rounded flex-1 border border-gray-300 dark:border-none ml-4 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                        type="text"
                        name="attributeName"
                        id="attributeName"
                        placeholder="Variant Name"
                        readOnly
                        value={singleAttribute.name}
                        onChange={(e) => {
                          setAttribute((prevState) =>
                            prevState.map((item, index) =>
                              index === j
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                      <input
                        className="w-10 rounded flex-1 border border-gray-300 dark:border-none ml-4 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                        type="text"
                        name="attributeValue"
                        id="attributeValue"
                        placeholder="Variant Value"
                        value={singleAttribute.value}
                        onChange={(e) => {
                          setAttribute((prevState) =>
                            prevState.map((item, index) =>
                              index === j
                                ? { ...item, value: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                      <input
                        className="w-10 rounded flex-1 border border-gray-300 dark:border-none ml-4 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                        type="number"
                        name="attributeValue"
                        id="attributeValue"
                        placeholder="Variant Price"
                        value={singleAttribute.additional_price}
                        onChange={(e) => {
                          setAttribute((prevState) =>
                            prevState.map((item, index) =>
                              index === j
                                ? { ...item, additional_price: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                      <button
                        type="button"
                        className="bg-red-500 hover:bg-red-700 text-black dark:text-white font-medium py-2 px-4 rounded"
                        onClick={() => {
                          setAttribute((prevState) =>
                            prevState.filter((_, index) => index !== j)
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ml-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    setAttribute((i) => [
                      ...i,
                      { name: "", value: "", additional_price: 0 },
                    ]);
                  }}
                >
                  Add another Variant
                </button>
              </div>
            </div>
          </div>
          <button
            className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-white dark:text-gray-200 hover:bg-opacity-95 dark:bg-opacity-90 hover:shadow-lg transition duration-300 mt-3 w-1/2 md:w-1/6"
            type="submit"
          >
            Edit Product
          </button>
        </form>
      )}
    </div>
  );
}
