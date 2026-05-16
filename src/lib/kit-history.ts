import { useCallback, useRef, useState } from "react";

export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, force] = useState(0);
  const tick = () => force((n) => n + 1);

  const set = useCallback((updater: T | ((prev: T) => T), record = true) => {
    setPresent((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      if (record && next !== prev) {
        past.current.push(prev);
        if (past.current.length > 50) past.current.shift();
        future.current = [];
      }
      return next;
    });
    queueMicrotask(tick);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    setPresent((prev) => {
      const prior = past.current.pop()!;
      future.current.push(prev);
      return prior;
    });
    tick();
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    setPresent((prev) => {
      const next = future.current.pop()!;
      past.current.push(prev);
      return next;
    });
    tick();
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
