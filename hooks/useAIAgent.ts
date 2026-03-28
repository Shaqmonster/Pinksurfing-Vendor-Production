import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAgentStatus,
  fetchAgentLogs,
  fetchAgentCategories,
  fetchAgentProducts,
  agentStart,
  agentPause,
  agentResume,
  agentStop,
  agentReset,
  agentFetch,
  updateAgentConfig,
  getAgentWsUrl,
} from '@/api/aiAgent';

export interface AgentStats {
  totalProducts: number;
  pending: number;
  posted: number;
  failed: number;
  successRate: number;
  totalBatches: number;
  avgPostTime: number;
  lastPostAt: string | null;
}

export interface AgentConfig {
  batchSize: number;
  postIntervalSeconds: number;
  djangoApiUrl: string;
  autoPost: boolean;
}

export interface AgentStatus {
  state: 'idle' | 'running' | 'paused' | 'error';
  stats: AgentStats;
  config: AgentConfig;
}

export interface AgentProduct {
  _id: string;
  id: string;
  externalId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  currency: string;
  category: string;
  brand: string;
  sku: string;
  images: string[];
  specifications: Record<string, string>;
  sourceUrl: string;
  postedAt: string | null;
  status: 'pending' | 'posted' | 'failed';
  lastError?: string;
  createdAt: string;
}

export interface AgentProductsResponse {
  products: AgentProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentLog {
  id: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  timestamp: string;
  data?: { image?: string; category?: string };
}

export interface AgentCategory {
  name: string;
  count: number;
}

export interface ProductFilters {
  status?: string;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useAIAgent() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [products, setProducts] = useState<AgentProductsResponse>({
    products: [],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
  });
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFiltersRef = useRef<ProductFilters>({});

  // ─── WebSocket ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function connect() {
      try {
        const ws = new WebSocket(getAgentWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          setConnected(true);
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          setConnected(false);
        };
      } catch {
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      }
    }

    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleWsMessage(msg: { type: string; data: any }) {
    switch (msg.type) {
      case 'init':
        setStatus(msg.data);
        break;
      case 'stateChange':
        setStatus(msg.data);
        break;
      case 'log':
        setLogs((prev) => {
          if (prev.find((l) => l.id === msg.data.id)) return prev;
          return [msg.data, ...prev].slice(0, 200);
        });
        break;
      case 'productPosted':
      case 'productFailed':
        setStatus((prev) =>
          prev ? { ...prev, stats: msg.data.stats ?? prev.stats } : prev
        );
        break;
      case 'batchComplete':
        loadStatus();
        loadProducts(currentFiltersRef.current);
        break;
      case 'configUpdate':
        setStatus((prev) => (prev ? { ...prev, config: msg.data } : prev));
        break;
      default:
        break;
    }
  }

  // ─── REST Loaders ──────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchAgentStatus();
      setStatus(data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  const loadProducts = useCallback(async (filters: ProductFilters = {}) => {
    currentFiltersRef.current = filters;
    try {
      const data = await fetchAgentProducts(
        filters as Record<string, string | number | undefined>
      );
      setProducts(data);
    } catch {
      // keep previous products
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchAgentLogs({ limit: '100' });
      setLogs(data);
    } catch {
      // ignore
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAgentCategories();
      setCategories(data);
    } catch {
      // ignore
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadStatus();
    loadCategories();
    loadLogs();
    loadProducts();
  }, [loadStatus, loadCategories, loadLogs, loadProducts]);

  useEffect(() => {
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  // ─── Agent Actions ─────────────────────────────────────────────────────────

  const startAgent = useCallback(async () => {
    try { await agentStart(); } catch { /* ignore */ }
  }, []);

  const pauseAgent = useCallback(async () => {
    try { await agentPause(); } catch { /* ignore */ }
  }, []);

  const resumeAgent = useCallback(async () => {
    try { await agentResume(); } catch { /* ignore */ }
  }, []);

  const stopAgent = useCallback(async () => {
    try { await agentStop(); } catch { /* ignore */ }
  }, []);

  const resetAgent = useCallback(async () => {
    try {
      await agentReset();
      setLogs([]);
    } catch { /* ignore */ }
  }, []);

  const triggerFetch = useCallback(async (queries: string[], maxItems: number) => {
    try {
      return await agentFetch(queries, maxItems);
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }, []);

  const saveConfig = useCallback(async (config: Record<string, unknown>) => {
    try { await updateAgentConfig(config); } catch { /* ignore */ }
  }, []);

  return {
    status,
    products,
    logs,
    categories,
    connected,
    wsConnected,
    loadProducts,
    loadLogs,
    startAgent,
    pauseAgent,
    resumeAgent,
    stopAgent,
    resetAgent,
    triggerFetch,
    saveConfig,
  };
}
