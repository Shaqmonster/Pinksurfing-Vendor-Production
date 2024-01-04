export type Product = {
  id: string;
  name:string,
  unit_price: string | number,
  category:string,
  subcategory:string,
  tags:string,
  quantity:string | number,
  description:string,
  image: string | Blob
};
 