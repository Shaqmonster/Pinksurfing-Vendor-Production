// "use client";
// import React, { useState, useEffect, useMemo } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { getCategories, getSubcategories, saveProducts } from "@/api/products";
// import { Product } from "@/types/product";
// import { redirect } from "next/navigation";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import dynamic from "next/dynamic";

// const AddProducts = () => {
//   const [categories, setCategories] = useState([]);
//   const [subcategories, setSubcategories] = useState([]);
//   const [brandName, setBrandName] = useState("");
//   const [filteredSubcategories, setFilteredSubcategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [selectedSubcategory, setSelectedSubcategory] = useState("");
//   const [files, setFiles] = useState<File[]>([]);
//   const [alert_, setAlert] = useState(false);
//   const [attribute, setAttribute] = useState([
//     {
//       name: "",
//       value: "",
//       additional_price: 0,
//     },
//   ]);
//   const ReactQuill = useMemo(
//     () => dynamic(() => import("react-quill"), { ssr: false }),
//     []
//   );

//   const formats = [
//     "header",
//     "bold",
//     "italic",
//     "underline",
//     "strike",
//     "blockquote",
//     "list",
//     "bullet",
//     "indent",
//     "link",
//     "color",
//     "clean",
//   ];

//   interface ProductData {
//     name: string;
//     unit_price: string;
//     mrp: string;
//     category: string;
//     brand_name: string;
//     subcategory: string;
//     tags: string;
//     meta_title: string;
//     quantity: string;
//     short_description: string;
//     description: string;
//     image: string;
//     id: string;
//   }

//   const [productData, setProductData] = useState<ProductData>({
//     name: "",
//     unit_price: "",
//     mrp: "",
//     category: "",
//     subcategory: "",
//     brand_name: "",
//     tags: "",
//     meta_title: "",
//     quantity: "",
//     short_description: "",
//     description: "",
//     image: "",
//     id: "",
//   });

//   const notifySuccess = (success: string) => toast.success(success);
//   const notifyError = (message: string) => toast.error(`Error: ${message}`);

//   useMemo(() => {
//     getCategories().then((data) => {
//       setCategories(data);
//       console.log(data);
//     });
//     getSubcategories().then((data) => {
//       setSubcategories(data);
//       console.log(data);
//     });
//   }, []);

//   useEffect(() => {
//     if (selectedCategory) {
//       let filteredCategory = subcategories.filter(
//         (i: { slug: string; name: string; category: string }) =>
//           i.category === selectedCategory
//       );
//       setFilteredSubcategories(filteredCategory);
//       console.log(filteredCategory);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedCategory]);

//   const updateSubCategory = (value: string) => {
//     setSelectedCategory(value);
//     console.log(value);
//   };

//   const updateProductData = (
//     key: keyof Product | "brand_name", // Updated to include "brand_name"
//     value: string | number | File[]
//   ) => {
//     setProductData((data: any) => {
//       let returnable = { ...data };
//       if (key === "image" && Array.isArray(value)) {
//         returnable[key] = value;
//       } else {
//         returnable[key] = value.toString();
//       }

//       console.log(returnable);
//       return returnable;
//     });

//     // Handle brand name separately
//     if (key === "brand_name") {
//       setBrandName(value.toString());
//     }
//   };

//   const updateFile = (fileData: File) => {
//     setFiles((prevFiles) => [...prevFiles, fileData]);
//     updateProductData("image", [...files, fileData]);
//   };

//   const removeFile = (index: number) => {
//     setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
//     updateProductData(
//       "image",
//       files.filter((_, i) => i !== index)
//     );
//   };

//   const handleSave = async () => {
//     if (typeof window !== "undefined") {
//       let token = localStorage.getItem("access");
//       let vendor_id = localStorage.getItem("vendor_id");
//       console.log(productData);
//       console.log(files);

//       try {
//         const res = await saveProducts(
//           token,
//           vendor_id,
//           productData,
//           attribute,
//           files
//         );
//         console.log(res);

//         if (res.error) {
//           notifyError(res.message || "Error adding product");
//         } else {
//           console.log(res);
//           notifySuccess(res.data.Status);
//         }
//       } catch (error) {
//         notifyError(error.message || "Unexpected error occurred");
//       }
//     }
//   };

//   return (
//     <>
//       <form
//         onSubmit={handleSubmit}
//         className=" w-full min-h-[100vh] h-fit bg-[#F8F9FA]  dark:bg-black px-[1%] py-4 md:py-10"
//       >
//         <div className="flex items-center justify-between">
//           <p className="dark:text-gray-400 text-[#363F4D] font-bold plus-jakarta text-[17px] md:text-[23px] 2xl:text-[25px]">
//             Add New Product
//           </p>
//         </div>

//         <div className=" md:px-[1%] flex flex-col items-center lg:items-start lg:grid grid-cols-6 md:m-6 mb-14  ">
//           <div className="  md:m-0 flex flex-col gap-5 col-span-3 ">
//             <div className=" bg-white dark:bg-white/5 rounded-md py-4 ">
//               <div className=" flex flex-col ">
//                 <h4 className=" px-7 pb-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta border-b border-gray-200  dark:text-gray-400  text-[#363F4D] mb-1.5 ">
//                   Basic
//                 </h4>

//                 <div className=" md:mt-6 px-7 h-fit ">
//                   <div className=" flex-col flex">
//                     <label
//                       className=" dark:text-gray-400  text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px]"
//                       htmlFor="product-title"
//                     >
//                       Product title
//                       <span className=" text-red-500 text-[24px]">*</span>
//                     </label>
//                     <input
//                       required
//                       name="title"
//                       id="product-title"
//                       type="text"
//                       className="w-full p-2 dark:bg-white/10 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px]"
//                       placeholder="Type here"
//                       value={productData.title}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                 </div>
//                 <div className=" md:mt-1 mb-10 px-7 ">
//                   <div className=" flex-col flex">
//                     <label
//                       className="dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px]"
//                       htmlFor="description"
//                     >
//                       Short Description{" "}
//                       <span className="text-red-500 text-[24px]">*</span>
//                     </label>
//                     <ReactQuill
//                       className="h-[150px]"
//                       theme="snow"
//                       value={productData.description}
//                       formats={formats}
//                       onChange={(textValue) =>
//                         setProductData({
//                           ...productData,
//                           description: textValue,
//                         })
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className=" px-7 sm:grid grid-cols-3 gap-5 xl:gap-[3%] md:mt-1 ">
//                   <div className=" flex-col flex">
//                     <label
//                       className=" dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] "
//                       htmlFor="Price"
//                     >
//                       Price
//                       <span className=" text-red-500 text-[24px]">*</span>
//                     </label>
//                     <input
//                       required
//                       name="price"
//                       id="Price"
//                       type="number"
//                       className=" w-full p-2 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10"
//                       placeholder="DH"
//                       value={productData.unit_price}
//                       onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                         updateProductData("unit_price", e.target?.value)
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className=" px-7 sm:grid grid-cols-3 gap-5 xl:gap-[3%] md:mt-6 ">
                  
//                 <div className=" px-7 sm:grid grid-cols-3 gap-5 xl:gap-[3%] md:mt-6 ">
//                   <div className=" flex-col flex">
//                     <label
//                       className=" dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1 "
//                       htmlFor="metaTitle"
//                     >
//                       Meta Title
//                     </label>
//                     <input
//                       name="metaTitle"
//                       id="metaTitle"
//                       type="text"
//                       className=" w-full p-2 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10"
//                       placeholder="Meta Title"
//                       value={productData.meta_title}
//                       onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                         updateProductData("meta_title", e.target?.value)
//                       }
//                     />
//                   </div>
//                   <div className=" flex-col flex">
//                     <label
//                       className=" dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1 "
//                       htmlFor="metaHead"
//                     >
//                       Meta Tag
//                     </label>
//                     <input
//                       name="metaTags"
//                       id="metaTags"
//                       type="text"
//                       className=" w-full p-2 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10"
//                       placeholder="Tags seperated by spaces"
//                       onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                         updateProductData("tags", e.target?.value)
//                       }
//                     />
//                   </div>
//                 </div>
//                 <div className="flex flex-col pb-14 px-7 mt-5 ">
//                   <label className=" dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1 ">
//                     Long Description
//                   </label>
//                   <ReactQuill
//                     className="h-[150px]"
//                     theme="snow"
//                     value={productData.description}
//                     formats={formats}
//                     onChange={(textValue) =>
//                       setProductData({
//                         ...productData,
//                         description: textValue,
//                       })
//                     }
//                   />
//                 </div>
//               </div>
//             </div>
//             <div className=" md:m-0 bg-white dark:bg-white/5 py-4 rounded-md col-span-3 ">
//               <div className=" flex flex-col pb-9 ">
//                 <h4 className=" px-7 pb-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta border-b border-gray-200  dark:text-gray-400 text-[#363F4D] mb-1.5 ">
//                   Dimensions
//                 </h4>

//                   <div className=" border border-gray-200 md:m-0 bg-white dark:bg-white/5 rounded-md col-span-3 ">
//                     <h4 className=" p-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta border-b border-gray-200  dark:text-gray-400 text-[#363F4D] mb-1.5 ">
//                       Additional Images
//                       <span className=" text-red-500 text-[24px]">*</span>
//                     </h4>
//                     <div className=" flex-col flex items-center justify-center px-5 py-3">
                      
//                       <div className=" flex flex-col items-center text-sm justify-center relative w-full h-[300px]">
//                         <FileUploader
//                           multiple
//                           handleChange={handleChange}
//                           name="file"
//                           types={fileTypes}
//                           required
//                           style={{ height: "500px" }}
//                           hoverTitle="Drop Your Product Images here"
//                         />
//                         <p className=" mt-1 text-gray-700">
//                           {file
//                             ? `File name: ${file[0].name}`
//                             : "no files uploaded yet"}
//                         </p>
//                         <p className=" text-gray-700">
//                           maximum upload size : 256 MB
//                         </p>
//                       </div>
//                     </div>
//                 </div>
//               </div>{" "}
//             </div>
//             <div className=" md:m-0 mt-4 py-5 bg-white dark:bg-white/5 rounded-md col-span-5 ">
//               <div className=" flex items-baseline justify-between border-b border-gray-200 mb-1.5">
//                 <h4 className=" px-7 pb-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta   dark:text-gray-400 text-[#363F4D]  ">
//                   Add Attribute
//                 </h4>
//             </div>
//           </div>

//           <div className=" w-full px-[2%] sm:px-[8%] flex flex-col justify-between gap-5  sm:m-8 md:m-0 md:mb-14 col-span-3 ">
//             <div className=" md:m-0 bg-white dark:bg-white/5 rounded-md col-span-3 ">
//               <h4 className=" px-7 py-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta border-b border-gray-200  dark:text-gray-400 text-[#363F4D] mb-1.5 ">
//                 Main Image<span className=" text-red-500 text-[24px]">*</span>
//               </h4>
//               <div className=" flex-col flex items-center text-xs justify-center px-5 py-3">
//                 <FileUploader
//                   multiple={true}
//                   handleChange={handleChange2}
//                   name="file"
//                   types={fileTypes}
//                   required
//                   style={{ height: "500px" }}
//                   hoverTitle="Drop Your Product Images here"
//                 />
//                 <p className=" mt-1 text-gray-700">
//                   {file
//                     ? `File name: ${file[0].name}`
//                     : "no files uploaded yet"}
//                 </p>
//                 <p className=" text-gray-700">maximum upload size : 256 MB</p>
//               </div>
//             </div>

//             <div className=" md:m-0 mt-4 py-5 bg-white dark:bg-white/5 rounded-md col-span-3 ">
//               <h4 className=" px-7 pb-3 text-[16px] md:text-[18px] 2xl:text-[20px] font-[700] plus-jakarta border-b border-gray-200  dark:text-gray-400 text-[#363F4D] mb-1.5 ">
//                 Categories
//               </h4>

//               <div className="flex-col flex mt-4 px-7">
//                 <label
//                   className="dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1"
//                   htmlFor="main-Category"
//                 >
//                   Main Category
//                 </label>
//                 <select
//                   name="mainCategory"
//                   id="main-Category"
//                   multiple
//                   className="w-full p-2 border border-gray-300 dark:border-white/30 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10 rounded-lg"
//                   value={productData.mainCategory}
//                   onChange={(e) => handleMultiSelectChange(e, "mainCategory")}
//                 >
//                   <option
//                     value=""
//                     className="border-b border-gray-300 dark:border-white/40"
//                   >
//                     Select Main Categories
//                   </option>
//                   {categories.map((category, index) => (
//                     <option
//                       key={index}
//                       value={category.fileName}
//                       className="border-b border-gray-300 dark:border-white/40"
//                     >
//                       {category.fileName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="flex-col flex mt-4 px-7">
//                 <label
//                   className="dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1"
//                   htmlFor="sub-Category"
//                 >
//                   Sub Category
//                 </label>
//                 <select
//                   name="subCategory"
//                   id="sub-Category"
//                   multiple
//                   className="w-full p-2 border border-gray-300 dark:border-white/30 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10 rounded-lg"
//                   value={productData.subCategory}
//                   onChange={(e) => handleMultiSelectChange(e, "subCategory")}
//                 >
//                   <option
//                     value=""
//                     className="border-b border-gray-300 dark:border-white/40"
//                   >
//                     Select Sub Categories
//                   </option>
//                   {getFilteredSubCategories().map((subcategory, index) => (
//                     <option
//                       key={index}
//                       value={subcategory.name}
//                       className="border-b border-gray-300 dark:border-white/40"
//                     >
//                       {subcategory.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="flex-col flex mt-4 px-7">
//                 <label
//                   className="dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1"
//                   htmlFor="series"
//                 >
//                   Series
//                 </label>
//                 <select
//                   name="series"
//                   id="series"
//                   multiple
//                   className="w-full p-2 border border-gray-300 dark:border-white/30 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10 rounded-lg"
//                   value={productData.series}
//                   onChange={(e) => handleMultiSelectChange(e, "series")}
//                 >
//                   <option
//                     value=""
//                     className="border-b border-gray-300 dark:border-white/40"
//                   >
//                     Select a Series
//                   </option>
//                   {getFilteredSeries().map((series, index) => (
//                     <option
//                       key={index}
//                       value={series.name}
//                       className="border-b border-gray-300 dark:border-white/40"
//                     >
//                       {series.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className=" md:mt-6 px-7 ">
//                 <div className=" flex-col flex">
//                   <label
//                     className=" dark:text-gray-400 text-[#4F5D77] font-[700] plus-jakarta text-[12px] md:text-[13px] 2xl:text-[14.4px] mb-1 "
//                     htmlFor="tags"
//                   >
//                     Tags
//                   </label>
//                   <input
//                     name="tags"
//                     id="tags"
//                     type="text"
//                     className=" w-full p-2 dark:text-gray-400 text-[#4F5D77] bg-[#f2f2f2] text-[14.4px] dark:bg-white/10"
//                     value={productData.tags}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </form>
//     </>
//   );
// };

// export default AddProducts;
