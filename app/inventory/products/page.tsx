"use client";
import { getProducts } from "@/api/products";
import ProductsTable from "@/components/Tables/productTable";
import Loader from "@/components/common/Loader";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
import { useMemo, useState } from "react";

const Products = () => {
  const [loading , setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([{
    name:"",
    unit_price:"",
    category:"",
    subcategory:"",
    image:"",
    quantity:"",
    tags:"",
    description:"",
    id: "",
  }])

  let access:string | null = "";
  let vendor_id:string | null = "";
  if(typeof window !== 'undefined'){
   access = localStorage.getItem('access');
   vendor_id = localStorage.getItem('vendor_id');
  }

  useMemo(()=>{
    getProducts(access, vendor_id)
    .then((data:any)=>{
      console.log(data.status)
      if('status' in data && data.status < 205){
        let products_data:[Product] = data.data.Products;
        console.log(products_data)
        if(!products_data.length){
          redirect('/inventory/add_products')
        }
        if(typeof products_data == 'object' && products_data.length){
          let slicedData = products_data.slice(0,10);
            setProducts(slicedData)
          }
        }
      })
      setTimeout(()=>setLoading(false),1500)
    },[access, vendor_id])
    
    

  
  return (
    <>
    {
      loading ? 
    (<Loader/>)
    :
      (<div className="flex flex-col gap-10">
        <ProductsTable Products={products}/>
      </div>)
}
    </>
  );
};

export default Products;
