import LegacyEditProductRedirect from "./legacy-edit-redirect";

/** Legacy /inventory/editProduct/:id URLs redirect to /inventory/edit-product?id= */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function LegacyEditProductPage() {
  return <LegacyEditProductRedirect />;
}
