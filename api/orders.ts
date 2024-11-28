import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getOrders(token: string | null) {
  let res = await axios
    .get(`${BASE_URL}/vendor/all-orders/`, {
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}

export async function changeStatus(
  token,
  order_id,
  status,
  length = null,
  width = null,
  height = null,
  weight = null
) {
  let res = await axios
    .post(
      `${BASE_URL}/vendor/change-order-status/${order_id}/`,
      {
        status,
        length,
        width,
        height,
        weight,
      },
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

export async function getMonthlySales(token: string | null) {
  let res = await axios
    .get(`${BASE_URL}/vendor/monthly-sales/`, {
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}

export async function getParcelDetails(
  orderItemId: string | null,
  token: string | null
) {
  let res = await axios
    .get(`${BASE_URL}/shipping/parcel-details/${orderItemId}/`, { 
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}


export async function buyShipmentLabel(parcelId: string, token: string | null) {
  try {
    const response = await axios.post(
      `${BASE_URL}/shipping/buy-shipment-label/`,
      { parcel_id: parcelId },
      {
        headers: {
          Authorization: `Bearer ${token?.replaceAll('"', "")}`,
        },
      }
    );
    // Return the response data on success
    return { error: false, data: response.data };
  } catch (error: any) {
    // Handle request errors and API errors
    if (error.response) {
      console.error("API responded with an error:", error.response.data);
      return {
        error: true,
        message: error.response.data.message || "Failed to buy shipment label.",
      };
    } else {
      console.error("Request failed:", error.message);
      return { error: true, message: "Network error or server is unreachable." };
    }
  }
}

export async function getShipmentDetails(orderId: string, token: string | null) {
  try {
    const response = await axios.post(
      `${BASE_URL}/shipping/shipping-details/${orderId}/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token?.replaceAll('"', "")}`,
        },
      }
    );
    return response.data; // Return response data directly
  } catch (error) {
    // Handle error and log it
    console.error("Error fetching shipment details:", error);
    throw error;
  }
}

export async function getShippingDetails(
  orderItemId: string | null,
  token: string | null
) {
  let res = await axios
    .get(`${BASE_URL}/shipping/shipping-details/${orderItemId}/`, { 
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}