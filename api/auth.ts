import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function emailResetOtp(email: string) {
  return await axios.post(`https://auth.pinksurfing.com/api/send-otp/`, {
    email,
  });
}

export async function verifyOtp(
  email: string,
  entered_otp: string,
  new_password: string
) {
  return await axios.post(`https://auth.pinksurfing.com/api/password_reset/`, {
    email,
    entered_otp,
    new_password,
  });
}
