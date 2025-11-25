"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getSubcategories, saveProducts } from "@/api/products";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader, { Loader2 } from "@/components/common/Loader";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { handleError } from "@/utils/toast";
import { getCookie } from "@/utils/cookies";
const AddProducts = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandName, setBrandName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allowedAttributes, setAllowedAttributes] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  interface Attribute {
    name: string;
    value: string;
    additional_price: number;
  }
  const [attribute, setAttribute] = useState<Attribute[]>([]);

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
    id: ""
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
    "clean"
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
      setSubcategoriesLoading(true);
      getSubcategories(selectedCategory)
        .then((data) => {
          setSubcategories(data.data);
          setSubcategoriesLoading(false);
        })
        .catch(() => {
          setSubcategoriesLoading(false);
        });
    }
  }, [selectedCategory]);

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

  const handleDrop = (event: any) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length + files.length > 4) {
      toast.error("Cannot upload more than 4 images");
      return;
    }
    droppedFiles.forEach((file: any) => {
      if (file.type.startsWith("image/")) updateFile(file);
    });
  };

  const handleDragOver = (event: any) => {
    event.preventDefault();
  };

  const handleSave = async () => {
    if (typeof window !== "undefined") {
      let token = getCookie("access_token");
      let vendor_id = localStorage.getItem("vendor_id");
      const { mrp, unit_price } = productData;
      const finalUnitPrice = hasDiscount ? unit_price : mrp;
      const updatedProductData = {
        ...productData,
        unit_price: finalUnitPrice
      };
      console.log(updatedProductData);
      console.log(attribute);
      setLoading(true);
      try {
        const res: any = await saveProducts(
          token,
          vendor_id,
          updatedProductData,
          attribute,
          files
        );
        console.log(res);
        if (!res.error) {
          console.log(res);
          toast.success(res.data.Status);
          router.push("/inventory/products");
        } else {
          console.log(res);
          handleError(res.data.data.Status || "Error adding product");
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error.response.data.message || "Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-270">
      {loading ? (
        <Loader2 />
      ) : (
        <form onSubmit={handleSave} className="">
          <div className="flex justify-between border-b border-gray-200 pb-3 mb-6">
            <h1 className="w-full font-semibold text-black dark:text-white text-xl">
              Add Product
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
                        {/* <option value="0">categories[0]</option> */}
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
                        disabled={subcategoriesLoading || !selectedCategory}
                        onChange={(e: any) => {
                          const selectedSlug = e.target.value;
                          setSelectedSubcategory(selectedSlug);
                          updateProductData("subcategory", selectedSlug);

                          const selectedSubcat: any = subcategories.find(
                            (subcat: any) => subcat.slug === selectedSlug
                          );

                          if (selectedSubcat) {
                            setAllowedAttributes(
                              selectedSubcat?.allowed_attributes
                            );
                            const initialAttributes =
                              selectedSubcat?.allowed_attributes?.map(
                                (attr: any) => ({
                                  name: attr.name,
                                  value: "",
                                  additional_price: 0
                                })
                              );
                            // setAttribute(initialAttributes);
                          } else {
                            setAllowedAttributes([]);
                            setAttribute([]);
                          }
                          setSubcategoriesLoading(false);
                        }}
                      >
                        {/* <option value="0">Choose</option> */}
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
                      if (e.length <= 255) {
                        setProductData({
                          ...productData,
                          short_description: e
                        });
                      }
                    }}
                  />
                  <div
                    className={`text-xs mt-2 ${
                      productData.short_description.length >= 255
                        ? "text-red-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {productData.short_description.length}/255 characters
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
                      // defaultValue={0}
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
                        description: textValue
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
                    <div
                      className="flex flex-col items-center justify-center space-y-3"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      {files.map((file, index) => (
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
                      ))}
                      {!files.length ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="file-input"
                            onChange={(event) => {
                              const selectedFiles = event?.target?.files;
                              if (selectedFiles) {
                                if (selectedFiles.length + files.length > 4) {
                                  toast.error(
                                    "Cannot upload more than 4 images"
                                  );
                                  return;
                                }
                                const newFiles = Array.from(selectedFiles);
                                newFiles.forEach((file) => updateFile(file));
                              }
                            }}
                            multiple
                          />
                          <label
                            htmlFor="file-input"
                            className="cursor-pointer"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-none bg-white dark:bg-boxdark">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <line
                                  x1="8"
                                  y1="3"
                                  x2="8"
                                  y2="13"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <line
                                  x1="3"
                                  y1="8"
                                  x2="13"
                                  y2="8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </span>
                          </label>
                        </div>
                      ) : null}
                      <label>
                        <span className="text-primary cursor-pointer">
                          Click to upload or drag & drop
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
                      {files.length ? (
                        files.map((file, index) => (
                          <p key={index}>{file.name}</p>
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
                      type="number"
                      name="length"
                      id="length"
                      placeholder="Length"
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
                      type="number"
                      name="width"
                      id="width"
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
                      type="number"
                      name="height"
                      id="height"
                      placeholder="Height"
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
                      type="number"
                      name="weight"
                      id="weight"
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
              {attribute?.map((att, j) => {
                return (
                  <React.Fragment key={j}>
                    <div className="col-span-4 flex flex-col sm:flex-row justify-between gap-4 mb-4 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div className="flex-1">
                        <label
                          className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                          htmlFor={`attributeName-${j}`}
                        >
                          Variant Name
                        </label>
                        <select
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                          name="attributeName"
                          id={`attributeName-${j}`}
                          value={att.name}
                          onChange={(e) => {
                            setAttribute((i) => {
                              i[j]["name"] = e.target.value;
                              return [...i];
                            });
                          }}
                        >
                          <option value="">Select Attribute</option>
                          {allowedAttributes?.map(
                            (allowedAttribute: any, index) => (
                              <option key={index} value={allowedAttribute.name}>
                                {allowedAttribute.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label
                          className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                          htmlFor={`attributeValue-${j}`}
                        >
                          Variant Value
                        </label>
                        <input
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                          type="text"
                          name="attributeValue"
                          id={`attributeValue-${j}`}
                          placeholder="Variant Value"
                          value={att.value}
                          onChange={(e) => {
                            setAttribute((i) => {
                              i[j]["value"] = e.target.value;
                              return [...i];
                            });
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <label
                          className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                          htmlFor={`attributePrice-${j}`}
                        >
                          Additional Price
                        </label>
                        <input
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                          type="number"
                          name="attributePrice"
                          id={`attributePrice-${j}`}
                          placeholder="0"
                          value={att.additional_price}
                          onChange={(e) => {
                            setAttribute((i: any) => {
                              i[j]["additional_price"] = e.target.value;
                              return [...i];
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          className="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded h-fit transition duration-200"
                          onClick={(e) => {
                            e.preventDefault();
                            setAttribute((i) =>
                              i.filter((_, index) => index !== j)
                            );
                          }}
                        >
                          Delete
                        </button>
                      </div>
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
                      { name: "", value: "", additional_price: 0 }
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
            Add Product
          </button>
        </form>
      )}
    </div>
  );
};

export default AddProducts;
