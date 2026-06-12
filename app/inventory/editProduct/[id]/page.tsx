import EditProductClient from "./edit-product-client";

/** Static export shell — real product id comes from useParams() on the client. */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditProductPage() {
  return <EditProductClient />;
}
