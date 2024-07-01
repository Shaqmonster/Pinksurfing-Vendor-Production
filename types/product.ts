export type Product = {
  id: string;
  name: string;
  unit_price: string | number;
  mrp: string | number;
  category: string;
  brand_name: string | number;
  subcategory: string;
  tags: string;
  meta_title: string;
  quantity: string | number;
  short_description: string;
  description: string;
  image: string | Blob;
};
