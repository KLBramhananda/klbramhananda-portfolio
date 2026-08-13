/**
 * Lab event bus — a tiny typed pub/sub channel between the experiments and the
 * robot assistant. Experiments emit lifecycle events as they run; the assistant
 * (and anything else) subscribes without tight coupling.
 *
 * All events are local. Nothing crosses the network.
 */

export type LabEvent =
  | { type: "experiment:opened"; id: string; name: string }
  | { type: "experiment:started"; id: string; name: string }
  | { type: "experiment:success"; id: string; name: string; tone: "ok" }
  | { type: "experiment:warning"; id: string; name: string; tone: "warn"; detail?: string };

type LabListener = (event: LabEvent) => void;

const listeners = new Set<LabListener>();

export function subscribeToLab(listener: LabListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitLabEvent(event: LabEvent): void {
  for (const listener of listeners) listener(event);
}