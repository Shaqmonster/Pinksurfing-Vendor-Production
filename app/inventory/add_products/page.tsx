"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getSubcategories, saveProducts } from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/common/Loader";

const AddProducts = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandName, setBrandName] = useState("");
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
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
    quantity: "",
    short_description: "",
    description: "",
    image: "",
    id: "",
  });

  const notifySuccess = (success: string) => toast.success(success);
  const notifyError = (message: string) => toast.error(`Error: ${message}`);

  useMemo(() => {
    getCategories().then((data) => {
      setCategories(data);
      console.log(data);
    });
    getSubcategories().then((data) => {
      setSubcategories(data);
      console.log(data);
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

  const updateSubCategory = (value: string) => {
    setSelectedCategory(value);
    console.log(value);
  };

  const updateProductData = (
    key: keyof Product | "brand_name", // Updated to include "brand_name"
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

    // Handle brand name separately
    if (key === "brand_name") {
      setBrandName(value.toString());
    }
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
      };
      console.log(updatedProductData);
      setLoading(true);
      try {
        const res = await saveProducts(
          token,
          vendor_id,
          updatedProductData,
          attribute,
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

  return (
    <div className="mx-auto max-w-270">
      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5">
            <div className="rounded-sm border border-none bg-white shadow-default dark:border-nonedark dark:bg-primary">
              <div className="border-b border-none py-4 px-7 dark:border-nonedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add product
                </h3>
              </div>
              <div className="p-7">
                <div
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await handleSave();
                    }
                  }}
                >
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full xl:w-1/2">
                      <label
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                        htmlFor="Name"
                      >
                        Title
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                          type="text"
                          name="Name"
                          id="Name"
                          placeholder="Product Title"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateProductData("name", e.target?.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="w-full xl:w-1/2">
                      <label
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                        htmlFor="BrandName"
                      >
                        Brand Name
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                          type="text"
                          name="BrandName"
                          id="BrandName"
                          placeholder="Brand Name"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateProductData("brand_name", e.target?.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full xl:w-1/2">
                      <label
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                        htmlFor="MRP"
                      >
                        Price
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black dark:text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                          type="number"
                          name="mrp"
                          id="mrp"
                          placeholder="Price"
                          value={productData.mrp}
                          onChange={(e) =>
                            updateProductData("mrp", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    {hasDiscount && (
                      <div className="w-full xl:w-1/2">
                        <label
                          className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                          htmlFor="Unit Price"
                        >
                          Discounted Price
                        </label>
                        <div className="relative">
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
                                (
                                  cat: { slug: string; name: string },
                                  index
                                ) => {
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
                            setSelectedSubcategory(e.target.value);
                            updateProductData("subcategory", e.target?.value);
                          }}
                        >
                          <option value="0">Choose</option>
                          {filteredSubcategories.length && selectedCategory ? (
                            filteredSubcategories.map(
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
                  <div className="my-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="description"
                    >
                      Short Description
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                        name="bio"
                        id="bio"
                        rows={6}
                        placeholder="Describe your product"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateProductData(
                            "short_description",
                            e.target?.value
                          )
                        }
                      ></textarea>
                    </div>
                  </div>

                  <div className="my-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="description"
                    >
                      Long Description
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full rounded border border-gray-300 dark:border-none py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:focus:border-primary"
                        name="bio"
                        id="bio"
                        rows={6}
                        placeholder="Describe your product"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateProductData("description", e.target?.value)
                        }
                      ></textarea>
                    </div>
                  </div>

                  <div className="p-7 bg-gray-2 mb-5">
                    <form action="#" className="relative">
                      <h2 className="font-medium text-gray-700 text-center dark:text-black">
                        Upload Product Image.
                      </h2>
                      <div className="flex flex-col items-center justify-center space-y-3">
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
                                e.stopPropagation(); // Stop event propagation
                                removeFile(index);
                              }}
                              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ))}
                        {!files.length ? (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-none bg-white dark:bg-boxdark">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Your SVG paths for the icon */}
                            </svg>
                          </span>
                        ) : null}
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

                  <div className="col-span-3 row-span-2 flex flex-col justify-between gap-2">
                    <label
                      className="block uppercase tracking-wide text-xs font-bold mb-2 text-black dark:text-white"
                      htmlFor="grid-state"
                    >
                      Variants 'different sizes of the same or main item for
                      sale'
                    </label>
                    {attribute.map((atrributes, j) => {
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
                              onChange={(e: any) => {
                                setAttribute((i) => {
                                  i[j]["name"] = e.target.value;
                                  return i;
                                });
                              }}
                            />
                            <input
                              className="w-10 rounded flex-1 border border-gray-300 dark:border-none ml-4 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                              type="text"
                              name="attributeValue"
                              id="attributeValue"
                              placeholder="Variant Value"
                              onChange={(e: any) => {
                                setAttribute((i) => {
                                  i[j]["value"] = e.target.value;
                                  return i;
                                });
                              }}
                            />
                            <input
                              className="w-10 rounded flex-1 border border-gray-300 dark:border-none ml-4 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:bg-[#e7e0ec] dark:text-black dark:focus:border-primary"
                              type="number"
                              name="attributeValue"
                              id="attributeValue"
                              placeholder="Variant Price"
                              onChange={(e: any) => {
                                setAttribute((i) => {
                                  i[j]["additional_price"] = e.target.value;
                                  return i;
                                });
                              }}
                            />
                            <button
                              className="bg-red-500 hover:bg-red-700 text-black dark:text-white font-medium py-2 px-4 rounded"
                              onClick={() => {
                                setAttribute((i) =>
                                  i.filter((_, index) => index !== j)
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
                        className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ml-auto"
                        onClick={() => {
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

                  <div className="w-full">
                    <label
                      className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                      htmlFor="Title"
                    >
                      Meta Title
                    </label>
                    <div className="relative">
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
                  </div>

                  <div className="my-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full xl:w-1/2">
                      <label
                        className="mb-2 font-medium text-black dark:text-white block uppercase tracking-wide text-xs"
                        htmlFor="Tags"
                      >
                        Tags
                      </label>
                      <div className="relative">
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

                    <div className="w-full xl:w-1/2">
                      <label
                        className="block uppercase tracking-wide text-xs font-bold mb-2"
                        htmlFor="grid-state"
                      >
                        Stock
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
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button className="flex justify-center rounded border border-gray-300 dark:border-gray-600 py-2 px-6 font-medium text-black dark:text-white bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 hover:shadow-lg transition duration-300">
                      <Link href="/inventory/products">Cancel</Link>
                    </button>
                    <button
                      className="flex justify-center rounded border border-gray-300 dark:border-gray-600 bg-primary py-2 px-6 font-medium text-white dark:text-gray-200 hover:bg-opacity-95 dark:bg-opacity-90 hover:shadow-lg transition duration-300"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProducts;
