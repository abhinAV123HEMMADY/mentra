import type { PipelineUpdate } from "../types";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";

/** Subscribes to a learning session's live pipeline updates (Section 10). Returns a cleanup fn. */
export function subscribeToSession(sessionId: string, onUpdate: (msg: PipelineUpdate) => void): () => void {
  const socket = new WebSocket(`${WS_BASE}/ws/${sessionId}`);

  socket.onmessage = (event) => {
    const parsed = JSON.parse(event.data) as PipelineUpdate;
    onUpdate(parsed);
  };

  return () => socket.close();
}
