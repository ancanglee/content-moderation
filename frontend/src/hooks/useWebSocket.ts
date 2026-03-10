import { useCallback, useEffect, useRef, useState } from "react";
import type { BatchProgressMessage } from "../types";

export function useWebSocket(batchId: string | null) {
  const [messages, setMessages] = useState<BatchProgressMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!batchId) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws/batch/${batchId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as BatchProgressMessage;
        setMessages((prev) => [...prev, msg]);
      } catch {
        // ignore
      }
    };
  }, [batchId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const clear = useCallback(() => setMessages([]), []);

  return { messages, connected, clear };
}
