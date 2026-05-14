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
  length: string;
  width: string;
  height: string;
  weight: string;
  quantity: string | number;
  short_description: string;
  description: string;
  image: string | Blob;
  /** Hide SDE / EBITDA figure from buyers until they sign the NDA. */
  nda_lock_ebitda?: boolean;
  /** Hide full revenue breakdown and P&L tables from buyers until they sign the NDA. */
  nda_lock_full_financials?: boolean;
};
