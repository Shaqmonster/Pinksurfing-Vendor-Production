"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getSubcategories, saveProducts } from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddProducts = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [alert_, setAlert] = useState(false);
  const [attribute, setAttribute] = useState([{
    name: "",
    value: "",
    additional_price: 0
  }])


  interface ProductData {
    name: string;
    unit_price: string;
    category: string;
    subcategory: string;
    tags: string;
    quantity: string;
    description: string;
    image: string;
    id: string;
  }

  const [productData, setProductData] = useState<ProductData>({
    name: "",
    unit_price: "",
    category: "",
    subcategory: "perfumes",
    tags: "",
    quantity: "",
    description: "",
    image: "",
    id: "",
  });

  const notify = () => toast.success("Product added successfully");



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
    key: keyof Product,
    value: string | number | File[]
  ) => {
    setProductData((data: any) => {
      let returnable = { ...data };

      // If the key is 'image' and the value is an array of files, update it accordingly
      if (key === 'image' && Array.isArray(value)) {
        returnable[key] = value;
      } else {
        // Otherwise, handle other cases
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
    updateProductData("image", files.filter((_, i) => i !== index));
  };




  return (

      <div className="mx-auto max-w-270">
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add product
                </h3>
              </div>
              <div className="p-7">
                <div
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      if (typeof window !== "undefined") {
                        let access = localStorage.getItem("access");
                        let vendor_id = localStorage.getItem("vendor_id");
                        const res = await saveProducts(access, vendor_id, productData, attribute, files);
                        console.log(res);
                        if (res.status >= 400) {
                          alert(res.data.status || res.data.Status);
                        }
                      }
                    }
                  }}
                >
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full xl:w-1/2">
                      <label
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs font-bold mb-2"
                        htmlFor="Name"
                      >
                        Title
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-stroke  py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
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
                        className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs font-bold mb-2"
                        htmlFor="Unit Price"
                      >
                        Price
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-stroke  py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="number"
                          name="price"
                          id="price"
                          placeholder="Unit Price"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateProductData("unit_price", e.target?.value)
                          }
                        />
                      </div>
                    </div>
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
                          className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
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
                          className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                          id="grid-state"
                          onChange={(e: any) => {
                            setSelectedSubcategory(e.target.value);
                            updateProductData("subcategory", e.target?.value);
                          }}
                        >
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
                  <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="p-7 bg-gray-2">
                      <form action="#" className="relative">
                        <h2 className="font-medium text-gray-700 font-bold text-center dark:text-black">
                          Upload Product Image
                        </h2>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                          onChange={(event) => {
                            const selectedFiles = event?.target?.files;
                            if (selectedFiles) {
                              if(selectedFiles.length + files.length > 4){
                                toast.error("Cannot Uplaod more than 4 images")
                                return
                              }
                              const newFiles = Array.from(selectedFiles);
                              newFiles.forEach((file) => updateFile(file));
                            }
                          }}
                          multiple  // Add this attribute to allow selecting multiple files
                          
                        />
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
                                onClick={() => removeFile(index)}
                                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                              >
                                X
                              </button>
                            </div>
                          ))}
                          {!files.length ? (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
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
                          <p>
                            <span className="text-primary">Click to upload</span>
                          </p>
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

                    <div className="my-5.5">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="description"
                      >
                        Description
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full rounded border border-stroke bg-gray py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
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

                    <div className="col-span-3 row-span-2 flex flex-col justify-between gap-2">
                      <label className="block uppercase tracking-wide text-xs font-bold mb-2 text-black dark:text-white" htmlFor="grid-state">
                        Attributes
                      </label>
                      {
                        attribute.map((atrributes, j) => {
                          return (
                            <React.Fragment key={j}>
                              <div className="col-span-4 flex justify-between gap-2" key={j}>
                                <input
                                  className="w-10 rounded flex-1 border border-stroke ml-2 py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ml-4"
                                  type="text"
                                  name="attributeName"
                                  id="attributeName"
                                  placeholder="Attribute Name"
                                  onChange={(e: any) => {
                                    setAttribute(i => {
                                      i[j]['name'] = e.target.value
                                      return i
                                    })
                                  }}
                                />
                                <input
                                  className="w-10 rounded flex-1 border border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ml-4"
                                  type="text"
                                  name="attributeValue"
                                  id="attributeValue"
                                  placeholder="Attribute Value"
                                  onChange={(e: any) => {
                                    setAttribute(i => {
                                      i[j]['value'] = e.target.value
                                      return i
                                    })
                                  }}
                                />
                                <input
                                  className="w-10 rounded border flex-1 border-stroke py-3 pl-2 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ml-4"
                                  type="number"
                                  name="attributeValue"
                                  id="attributeValue"
                                  placeholder="Additional Price"
                                  onChange={(e: any) => {
                                    setAttribute(i => {
                                      i[j]['additional_price'] = e.target.value
                                      return i
                                    })
                                  }}
                                />
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-black dark:text-white font-medium py-2 px-4 rounded"
                                  onClick={() => {
                                    setAttribute((i) => i.filter((_, index) => index !== j));
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </React.Fragment>
                          )
                        })
                      }
                      <div className="flex justify-end">
                        <button
                          className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ml-auto"
                          onClick={() => {
                            setAttribute((i) => [...i, { name: "", value: "", additional_price: 0 }]);
                          }}
                        >
                          Add another Attribute
                        </button>
                      </div>
                    </div>




                    <div className="my-5.5 flex flex-col gap-5.5 sm:flex-row">
                      <div className="w-full xl:w-1/2">
                        <label
                          className="mb-3 font-medium text-black dark:text-white block uppercase tracking-wide text-xs font-bold mb-2"
                          htmlFor="Tags"
                        >
                          Tags
                        </label>
                        <div className="relative">
                          <input
                            className="w-full rounded border border-stroke  py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
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
                            className="w-full rounded border border-stroke  py-3 pl-2.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
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
                      <button className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white">
                        <Link href="/inventory/products">Cancel</Link>
                      </button>
                      <button
                        className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-95"
                        onClick={async (e) => {
                          if (typeof window !== "undefined") {
                            console.log("Product Data before sending:", productData);
                            let access = localStorage.getItem("access");
                            let vendor_id = localStorage.getItem("vendor_id");
                            const res = await saveProducts(access, vendor_id, productData, attribute, files);
                            console.log(res);
                            if (res.status >= 400) {
                              alert(res.data.status || res.data.Status);
                            }
                            else {
                              window.location.reload()
                              window.alert("Product added successfully")
                            }
                          }
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      );
};

      export default AddProducts;
