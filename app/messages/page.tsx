"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiMessageSquare, FiSend } from "react-icons/fi";
import {
  listConversations,
  listMessages,
  markConversationRead,
  myChatEmail,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "@/api/chat";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/common/Loader";

const POLL_MS = 8000;

function otherParty(conv: Conversation, me: string) {
  return conv.participants.find((p) => (p.email || "").toLowerCase() !== me) || conv.participants[0];
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    return sameDay
      ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Vendor inbox (retest N2.8): the same chat the storefront uses, so buyers on deals,
 * product requests and orders reach the seller here. Polls for new messages.
 */
export default function MessagesPage() {
  const [me, setMe] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
      setError(null);
    } catch {
      setError("Could not load your messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  // First load: who am I, the list, and ?c=<id> from links like "Message buyer".
  useEffect(() => {
    myChatEmail().then(setMe);
    loadConversations();
    const fromUrl = Number(new URLSearchParams(window.location.search).get("c"));
    if (fromUrl) setActiveId(fromUrl);
  }, [loadConversations]);

  const loadThread = useCallback(async (id: number) => {
    try {
      setMessages(await listMessages(id));
      markConversationRead(id);
    } catch {
      setError("Could not load this conversation.");
    }
  }, []);

  useEffect(() => {
    if (activeId == null) return undefined;
    loadThread(activeId);
    const timer = window.setInterval(() => {
      loadThread(activeId);
      loadConversations();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [activeId, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || activeId == null) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeId, text);
      setMessages((m) => [...m, msg]);
      setDraft("");
      loadConversations();
    } catch {
      setError("Message not sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const list = (
    <ul className="divide-y divide-surface-100 dark:divide-dark-border">
      {conversations.map((conv) => {
        const other = otherParty(conv, me);
        const selected = conv.id === activeId;
        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => setActiveId(conv.id)}
              className={`w-full text-left px-4 py-3 min-h-[64px] transition-colors ${
                selected ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-surface-50 dark:hover:bg-dark-hover"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">
                  {other?.username || other?.email || "Conversation"}
                </p>
                <span className="shrink-0 text-xs text-surface-400">
                  {conv.last_message ? fmtTime(conv.last_message.created_at) : ""}
                </span>
              </div>
              {conv.context_label && (
                <p className="truncate text-xs font-medium text-pink-600 dark:text-pink-300">{conv.context_label}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-surface-500 dark:text-surface-400">
                  {conv.last_message?.content || "No messages yet"}
                </p>
                {conv.unread_count > 0 && (
                  <span className="shrink-0 rounded-full bg-gradient-pink px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {conv.unread_count > 9 ? "9+" : conv.unread_count}
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Messages"
        description="Chats with buyers about your deals, requests and orders. Buyers see the same thread on PinkSurfing."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <CardSkeleton />
      ) : conversations.length === 0 ? (
        <div className="premium-card">
          <EmptyState
            icon={FiMessageSquare}
            title="No messages yet"
            description="When a buyer messages you about a listing, a deal or an offer, the conversation shows up here."
          />
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-light-border bg-white dark:border-dark-border dark:bg-dark-card md:grid-cols-[300px_1fr] md:h-[70vh]">
          {/* List: always on desktop; on phones only when no thread is open */}
          <div className={`${active ? "hidden md:block" : "block"} overflow-y-auto border-r border-light-border dark:border-dark-border`}>
            {list}
          </div>

          <div className={`${active ? "flex" : "hidden md:flex"} min-h-[60vh] flex-col md:min-h-0`}>
            {!active ? (
              <div className="m-auto p-6 text-center text-sm text-surface-500">Pick a conversation.</div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-light-border px-4 py-3 dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="md:hidden -ml-1 p-2 text-surface-500"
                    aria-label="Back to conversations"
                  >
                    <FiArrowLeft />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">
                      {otherParty(active, me)?.username || "Conversation"}
                    </p>
                    {active.context_label && (
                      <p className="truncate text-xs text-pink-600 dark:text-pink-300">{active.context_label}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-surface-500">No messages yet. Say hello.</p>
                  )}
                  {messages.map((m) => {
                    const mine = (m.sender?.email || "").toLowerCase() === me;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-gradient-pink text-white"
                              : "bg-surface-100 text-surface-800 dark:bg-dark-hover dark:text-surface-100"
                          }`}
                        >
                          {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                          {(m.attachments || []).map((a) => (
                            <a key={a.id} href={a.file} target="_blank" rel="noreferrer" className="block underline text-xs mt-1">
                              Attachment
                            </a>
                          ))}
                          <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-surface-400"}`}>
                            {fmtTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={onSend} className="flex items-end gap-2 border-t border-light-border p-3 dark:border-dark-border">
                  <label htmlFor="msg-draft" className="sr-only">Message</label>
                  <textarea
                    id="msg-draft"
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Write a message"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-surface-200 bg-transparent px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 dark:border-dark-border dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-pink px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <FiSend aria-hidden /> Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
