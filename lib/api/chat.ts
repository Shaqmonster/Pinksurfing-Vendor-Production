import axios from "axios";
import { resolveVendorApiToken, vendorAuthHeaders } from "@/utils/vendorAuth";
import { decodeJwt } from "@/utils/ssoSession";

// The same chat the storefront uses (/api/chat/), so buyers and sellers see one thread.
const BASE = process.env.NEXT_PUBLIC_BASE_URL;

export type ChatUser = { id: number; username: string; email: string; is_online?: boolean };

export type ChatMessage = {
  id: number;
  sender: ChatUser;
  content: string;
  created_at: string;
  is_read: boolean;
  attachments?: { id: number; file: string }[];
};

export type Conversation = {
  id: number;
  participants: ChatUser[];
  updated_at: string;
  last_message: ChatMessage | null;
  unread_count: number;
  context_label?: string | null;
};

async function headers() {
  return vendorAuthHeaders(await resolveVendorApiToken());
}

function rows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const results = (data as { results?: unknown })?.results;
  return Array.isArray(results) ? (results as T[]) : [];
}

/** Email of the signed-in vendor, read from their access token. */
export async function myChatEmail(): Promise<string> {
  const token = await resolveVendorApiToken();
  const payload = decodeJwt(token);
  return String(payload?.email || "").toLowerCase();
}

export async function listConversations(): Promise<Conversation[]> {
  const h = await headers();
  if (!h || !BASE) throw new Error("Please sign in again.");
  const res = await axios.get(`${BASE}/chat/conversations/`, { headers: h });
  return rows<Conversation>(res.data);
}

export async function listMessages(conversationId: number): Promise<ChatMessage[]> {
  const h = await headers();
  if (!h || !BASE) throw new Error("Please sign in again.");
  // Paged oldest-first; follow `next` so the newest messages are included (max 20 pages).
  const all: ChatMessage[] = [];
  let url: string | null = `${BASE}/chat/conversations/${conversationId}/messages/`;
  for (let i = 0; url && i < 20; i += 1) {
    const res: { data: unknown } = await axios.get(url, { headers: h });
    all.push(...rows<ChatMessage>(res.data));
    const next = (res.data as { next?: string | null })?.next;
    url = next || null;
  }
  return all;
}

export async function sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const h = await headers();
  if (!h || !BASE) throw new Error("Please sign in again.");
  const form = new FormData();
  form.append("content", content);
  const res = await axios.post(`${BASE}/chat/conversations/${conversationId}/messages/`, form, {
    headers: h,
  });
  return res.data as ChatMessage;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  const h = await headers();
  if (!h || !BASE) return;
  try {
    await axios.post(`${BASE}/chat/conversations/${conversationId}/mark-read/`, {}, { headers: h });
  } catch {
    // Read receipts are best-effort.
  }
}
