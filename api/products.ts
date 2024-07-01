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
    return { error: true, data: null };
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

export async function getSubcategories() {
  const res = await axios.get(BASE_URL + `/product/subcategories/`);
  const { data } = res;
  if (!data) {
    return { error: true, data: null };
  }
  return data;
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
    console.log(`Image${index + 1}:`, image);
    form.append(`image${index + 1}`, image);
  });

  form.append("attributes", JSON.stringify(attribute));
  form.append("vendor", vendor);

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
    const { status, message, response } = error;
    return { status, data: response, message, error: true };
  }
}

export async function updateProducts(
  token: string | null,
  vendor: string | null,
  payload: any
) {
  if (!token || !vendor) {
    return false;
  }
  vendor = vendor.replaceAll('"', "");
  let form = new FormData();
  form.append("vendor", vendor);

  for (let [key, value] of Object.entries(payload)) {
    if (key !== "image" && key !== "id") {
      form.append(key, `${value}`);
    }
  }
  if ("image" in payload) {
    form.append("file", payload["image"]);
    form.append("image", payload["image"]);
  }
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

export async function getProducts(token: string | null, store_name: string | null) {
  let res = await axios
    .get(
      `${BASE_URL}/product/vendor-products/${store_name}/`,
      {
        headers: {
          Authorization: `Bearer ${token?.replaceAll('"', "")}`,
        },
      }
    )
    .then((response) => response)
    .catch((error) => error);
  return res;
}

export async function changeOrderStatus(
  token: string | null,
  orderId: string,
  status: string
) {
  if (!token || !orderId) {
    return { error: true, data: null };
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/vendor/change-order-status/${orderId}/`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    const { status: responseStatus, data } = response;
    return { status: responseStatus, data, error: false };
  } catch (error) {
    return { error: true, data: null };
  }
}
