import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getSquareOnboardingUrl(token: string, vendorId: string) {
  try {
    const response = await axios.post(
      `${BASE_URL}/payments/square/onboarding-link/${vendorId}/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Square onboarding URL:", error);
    throw error;
  }
}
