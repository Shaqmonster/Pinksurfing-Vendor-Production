"use client";
import { MyContext } from "@/app/providers/context";
import ProductsTable from "@/components/Tables/productTable";
import Loader from "@/components/common/Loader";
import { Product } from "@/types/product";
import { useContext, useEffect } from "react";

interface ProductsProps {
  products: Product[];
  loading: boolean;
}

const Products = ({ products, loading }: ProductsProps) => {
  const { sidebarOpen, setSidebarOpen } = useContext(MyContext);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, [setSidebarOpen]);
  
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-10">
          <ProductsTable Products={products} />
        </div>
      )}
    </>
  );
};

export default Products;
