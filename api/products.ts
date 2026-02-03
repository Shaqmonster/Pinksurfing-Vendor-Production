import { Product } from "@/types/product";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getAllOrders(token: string | null) {
  if (!token) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(`${BASE_URL}/vendor/all-orders/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    });

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function getVendorProfile(token: string | null) {
  if (!token) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(`${BASE_URL}/vendor/profile/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    });

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function updateVendorProfile(
  token: string | null,
  profileData: any
) {
  if (!token) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/vendor/profile/`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: error };
  }
}

export async function getCategories() {
  const res = await axios.get(BASE_URL + "/product/categories/");
  const { data } = res;
  if (!data) {
    return { error: true, data: null };
  }
  return data;
}

// ============ NEW SCHEMA API FUNCTIONS ============

/**
 * Fetch all categories from the schema endpoint
 * Used for dynamic form generation (Step 1 - Category Selection)
 */
export async function getSchemaCategories() {
  try {
    const res = await axios.get(`${BASE_URL}/product/schema/categories/`);
    const { data } = res;
    if (!data) {
      return { error: true, data: null };
    }
    return { error: false, data: data.categories || [] };
  } catch (error) {
    console.error("Error fetching schema categories:", error);
    return { error: true, data: null };
  }
}

/**
 * Fetch subcategories for a specific category from the schema endpoint
 * Used for dynamic form generation (Step 2 - Subcategory Selection)
 */
export async function getSchemaSubcategories(categoryId: string) {
  if (!categoryId) {
    return { error: true, data: null };
  }

  try {
    const res = await axios.get(`${BASE_URL}/product/schema/subcategories/${categoryId}/`);
    const { data } = res;
    if (!data) {
      return { error: true, data: null };
    }
    return { error: false, data: data.subcategories || [], categoryId: data.category_id };
  } catch (error) {
    console.error("Error fetching schema subcategories:", error);
    return { error: true, data: null };
  }
}

/**
 * Fetch dynamic form fields for a specific category + subcategory
 * Returns field definitions (type, label, required, options, etc.)
 */
export async function getFormSchema(categoryId: string, subcategoryId: string) {
  if (!categoryId || !subcategoryId) {
    return { error: true, data: null };
  }

  try {
    const res = await axios.get(`${BASE_URL}/product/schema/form/${categoryId}/${subcategoryId}/`);
    const { data } = res;
    if (!data) {
      return { error: true, data: null };
    }
    return { 
      error: false, 
      data: {
        categoryId: data.category_id,
        subcategoryId: data.subcategory_id,
        fields: data.fields || []
      }
    };
  } catch (error) {
    console.error("Error fetching form schema:", error);
    return { error: true, data: null };
  }
}

/**
 * Validate form data against the schema before submission
 */
export async function validateFormData(categoryId: string, subcategoryId: string, formData: Record<string, any>) {
  if (!categoryId || !subcategoryId) {
    return { error: true, valid: false, errors: { general: "Category and subcategory are required" } };
  }

  try {
    const res = await axios.post(`${BASE_URL}/product/schema/validate/`, {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      data: formData
    });
    const { data } = res;
    return { error: false, valid: data.valid, errors: data.errors || {} };
  } catch (error) {
    console.error("Error validating form data:", error);
    return { error: true, valid: false, errors: { general: "Validation request failed" } };
  }
}

// ============ END SCHEMA API FUNCTIONS ============


export async function deleteProduct(
  token: string | null,
  vendor: string | null,
  productId: string
) {
  if (!token || !vendor) {
    return false;
  }

  try {
    const response = await axios.delete(
      `${BASE_URL}/product/delete-product/${productId}/`,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {}
}

export async function getSubcategories(category_slug: string | null) {
  if (!category_slug) {
    return { error: true, data: null };
  }

  try {
    const res = await axios.get(`${BASE_URL}/product/subcategories/${category_slug}/`);
    const { data } = res;
    if (!data) {
      return { error: true, data: null };
    }
    return { error: false, data };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function saveProducts(
  token: string | null,
  vendor: string | null,
  payload: Product,
  attribute: any,
  images: File[]
) {
  if (!token || !vendor) {
    return false;
  }
  vendor = vendor.replaceAll('"', "");
  let form = new FormData();

  for (let [key, value] of Object.entries(payload)) {
    if (key !== "image") {
      form.append(key, value.toString());
    }
  }

  images.forEach((image, index) => {
    form.append(`image${index + 1}`, image);
  });

  form.append("attributes", JSON.stringify(attribute));
  form.append("vendor", vendor);
  console.log("Form Data Entries:");
  form.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  try {
    const response = await axios.post(
      `${BASE_URL}/product/add-product/`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );
    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    const { status, message, response } : any = error;
    return { status, data: response, message, error: true };
  }
}

export async function updateProducts(
  token: string | null,
  vendor: string | null,
  payload: any,
  images: File[]
) {
  if (!token || !vendor) {
    return false;
  }
  vendor = vendor.replaceAll('"', "");
  let form = new FormData();
  form.append("vendor", vendor);

  for (let [key, value] of Object.entries(payload)) {
    if (key !== "image" && key !== "id") {
      if (key === "attributes") {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, `${value}`);
      }
    }
  }

  images.forEach((image, index) => {
    form.append(`image${index + 1}`, image);
  });

  if (!("id" in payload)) {
    return false;
  }
  const res = await axios
    .put(`${BASE_URL}/product/edit-product/${payload["id"]}/`, form, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
        // "Content-Type": "multipart/form-data"
      },
    })
    .then((response) => {
      let { status, data } = response;
      return { status, data, error: false };
    })
    .catch((error) => {
      let { status, message, response } = error;
      return { status, data: response, message, error: true };
    });

  return res;
}

export async function getSingleOrder(token: string | null, orderId: string) {
  if (!token || !orderId) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/vendor/single-order/${orderId}/`,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function getProducts(
  token: string | null,
  store_slug: string | null
) {
  let res = await axios
    .get(`${BASE_URL}/product/vendor-products/${store_slug}/`, {
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}

export async function getSingleProduct(
  token: string | null,
  productId: string
) {
  if (!token || !productId) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/product/product/${productId}/`,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function getTopSellingProducts(token: string | null) {
  if (!token) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/vendor/top-selling-products/`,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status, data } = response;
    return { status, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}

export async function changeOrderStatus(
  token: string | null,
  orderId: string,
  status: string,
  additionalFields: { length: string; width: string; height: string; weight: string }
) {
  if (!token || !orderId) {
    console.error("Token or order ID is missing");
    throw new Error("Token or order ID is required to update the order status.");
  }

  console.log("Changing order status with:", { status, ...additionalFields });

  try {
    const response = await axios.post(
      `${BASE_URL}/vendor/change-order-status/${orderId}/`,
      { status, ...additionalFields },
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    return response.data; // Return response data directly
  } catch (error: any) {
    if (error.response) {
      console.error("API responded with an error:", error.response.data);
      throw new Error(error.response.data.message || "Failed to update order status.");
    } else {
      console.error("Error during the request:", error.message);
      throw new Error("Network error or server is unreachable.");
    }
  }
}
