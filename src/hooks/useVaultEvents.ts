"use client";

import { useEffect, useRef } from "react";
import { useVaultStore } from "@/stores/vaultStore";

export function useVaultEvents() {
  const { fetchHints, fetchVaultState } = useVaultStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource("/api/vault/events");
      esRef.current = es;

      es.addEventListener("hint", () => {
        // New hint arrived — refresh hints
        fetchHints();
      });

      es.addEventListener("heat", (e) => {
        try {
          const data = JSON.parse(e.data);
          useVaultStore.setState({ heatLevel: data.heatLevel });
        } catch {}
      });

      es.addEventListener("cracked", () => {
        // Vault was cracked — refresh everything
        fetchVaultState();
        fetchHints();
      });

      es.addEventListener("reconnect", (e) => {
        try {
          const data = JSON.parse(e.data);
          reconnectTimeout = setTimeout(connect, data.after || 1000);
        } catch {
          reconnectTimeout = setTimeout(connect, 1000);
        }
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 5s on error
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      esRef.current?.close();
    };
  }, [fetchHints, fetchVaultState]);
}
