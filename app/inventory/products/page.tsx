"use client";
import ProductsTable from "@/components/Tables/productTable";
import Loader from "@/components/common/Loader";
import { Product } from "@/types/product";

interface ProductsProps {
  products: Product[];
  loading: boolean;
}

const Products = ({ products, loading }: ProductsProps) => {
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
