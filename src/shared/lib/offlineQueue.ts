const QUEUE_KEY = "sodam_offline_queue";

export type HttpMethod = "post" | "put" | "delete";

export interface QueuedRequest {
  id: string;
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  createdAt: number;
}

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // 무시
  }
}

export const offlineQueue = {
  add(method: HttpMethod, url: string, data?: unknown): QueuedRequest {
    const queue = loadQueue();
    const entry: QueuedRequest = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      method,
      url,
      data,
      createdAt: Date.now(),
    };
    queue.push(entry);
    saveQueue(queue);
    return entry;
  },

  getAll(): QueuedRequest[] {
    return loadQueue();
  },

  remove(id: string): void {
    const queue = loadQueue().filter((q) => q.id !== id);
    saveQueue(queue);
  },

  clear(): void {
    localStorage.removeItem(QUEUE_KEY);
  },

  size(): number {
    return loadQueue().length;
  },
};
