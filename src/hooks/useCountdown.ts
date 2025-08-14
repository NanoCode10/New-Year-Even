import { useEffect, useState } from "react";

/**
 * @param initialTime  tiempo inicial en segundos (no ms)
 * @param callback     se ejecuta al llegar a 0
 * @param intervalMs   intervalo en ms (default 1000)
 */
export const useCountdown = (
  initialTime: number,
  callback: () => void,
  intervalMs: number = 1000
) => {
  const [timer, setTimer] = useState<number>(initialTime);

  // si cambia el initialTime desde fuera, sincroniza estado
  useEffect(() => setTimer(initialTime), [initialTime]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1) return prev - 1;
        // llega a 0
        callback();
        return initialTime;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [callback, initialTime, intervalMs]);

  return timer;
};
