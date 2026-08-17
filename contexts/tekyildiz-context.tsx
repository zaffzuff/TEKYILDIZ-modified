"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import {
  DEFAULT_SETTINGS,
  KEY_SETTINGS,
  getDataset,
  sanitizeSettings,
  settingsToBlob,
  type Dataset,
  type Settings,
  type SortId,
  type TabId,
} from "@/lib/tekyildiz/data";

// ---- Storage surface -------------------------------------------------------
// The template exposes user-state on `sdk.state` ({ get, set }). We keep our
// own minimal interface and fall back to an in-memory store when the SDK isn't
// ready yet, so the UI never blocks on storage.

interface StoredRecord {
  blob: Record<string, unknown>;
}

interface StorageApi {
  get(key: string): Promise<StoredRecord | null>;
  set(key: string, blob: Record<string, unknown>): Promise<void>;
}

function makeMemStore(): StorageApi {
  const mem = new Map<string, Record<string, unknown>>();
  return {
    async get(key) {
      return mem.has(key) ? { blob: mem.get(key)! } : null;
    },
    async set(key, blob) {
      mem.set(key, blob);
    },
  };
}

// ---- Debounced, backoff-aware writer --------------------------------------

class KeyWriter {
  private store: StorageApi;
  private key: string;
  private debounceMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: Record<string, unknown> | null = null;
  private backoff = 0;
  private static lastAny = 0;
  private onTrouble: (v: boolean) => void;

  constructor(
    store: StorageApi,
    key: string,
    debounceMs: number,
    onTrouble: (v: boolean) => void,
  ) {
    this.store = store;
    this.key = key;
    this.debounceMs = debounceMs;
    this.onTrouble = onTrouble;
  }

  schedule(blob: Record<string, unknown>) {
    this.pending = blob;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.debounceMs);
  }

  now(blob: Record<string, unknown>) {
    this.pending = blob;
    if (this.timer) clearTimeout(this.timer);
    void this.flush();
  }

  private async flush() {
    if (this.pending == null) return;
    const blob = this.pending;
    const sinceAny = Date.now() - KeyWriter.lastAny;
    if (sinceAny < 1000) {
      // keep a global minimum gap across all keys
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1000 - sinceAny);
      return;
    }
    this.pending = null;
    KeyWriter.lastAny = Date.now();
    try {
      await this.store.set(this.key, blob);
      this.backoff = 0;
      this.onTrouble(false);
    } catch {
      // rejected — retry with backoff, never lose state
      this.pending = blob;
      this.backoff = this.backoff === 0 ? 3000 : Math.min(this.backoff * 1.8, 30000);
      this.onTrouble(true);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), this.backoff);
    }
  }

  flushSync() {
    if (this.pending == null) return;
    const blob = this.pending;
    this.pending = null;
    void this.store.set(this.key, blob).catch(() => {
      this.pending = blob;
    });
  }
}

// ---- Context ---------------------------------------------------------------

interface TekyildizContextType {
  ready: boolean;
  storageTrouble: boolean;
  data: Dataset;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  appSort: SortId;
  setAppSort: (s: SortId) => void;
  projectSort: SortId;
  setProjectSort: (s: SortId) => void;
}

const TekyildizContext = createContext<TekyildizContextType | undefined>(undefined);

export function TekyildizProvider({ children }: { children: ReactNode }) {
  const { sdk } = usePiAuth();
  const data = useMemo(() => getDataset(), []);

  const [ready, setReady] = useState(false);
  const [storageTrouble, setStorageTrouble] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);

  const storeRef = useRef<StorageApi | null>(null);
  const writerRef = useRef<KeyWriter | null>(null);

  // Resolve the storage surface once the SDK is available.
  useEffect(() => {
    const store: StorageApi =
      sdk && (sdk as unknown as { state?: StorageApi }).state
        ? ((sdk as unknown as { state: StorageApi }).state)
        : makeMemStore();
    storeRef.current = store;
    writerRef.current = new KeyWriter(store, KEY_SETTINGS, 900, setStorageTrouble);

    let cancelled = false;
    (async () => {
      try {
        const rec = await store.get(KEY_SETTINGS);
        if (!cancelled && rec) {
          const loaded = sanitizeSettings(rec);
          settingsRef.current = loaded;
          setSettings(loaded);
        }
      } catch {
        // fresh start on any read failure
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  // Flush on tab hide / unload so nothing is lost.
  useEffect(() => {
    const flush = () => writerRef.current?.flushSync();
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const persist = (next: Settings, immediate: boolean) => {
    settingsRef.current = next;
    setSettings(next);
    const blob = settingsToBlob(next);
    if (immediate) writerRef.current?.now(blob);
    else writerRef.current?.schedule(blob);
  };

  const setActiveTab = (t: TabId) => persist({ ...settingsRef.current, activeTab: t }, false);
  const setAppSort = (s: SortId) => persist({ ...settingsRef.current, appSort: s }, false);
  const setProjectSort = (s: SortId) =>
    persist({ ...settingsRef.current, projectSort: s }, false);

  const value: TekyildizContextType = {
    ready,
    storageTrouble,
    data,
    activeTab: settings.activeTab,
    setActiveTab,
    appSort: settings.appSort,
    setAppSort,
    projectSort: settings.projectSort,
    setProjectSort,
  };

  return <TekyildizContext.Provider value={value}>{children}</TekyildizContext.Provider>;
}

export function useTekyildiz() {
  const ctx = useContext(TekyildizContext);
  if (ctx === undefined) {
    throw new Error("useTekyildiz must be used within a TekyildizProvider");
  }
  return ctx;
}
