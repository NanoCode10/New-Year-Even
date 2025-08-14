/**
 *
 * @paraps
 */

import { useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { getNextNewYear, pad2 } from "../utils/date";

export const NewYear = () => {
  // Estado con "ahora" en ms; lo actualizamos cada 1s con tu hook
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Usamos tu hook como TICKER: el valor devuelto no lo usamos
  useCountdown(1, () => setNowMs(Date.now()), 1000);

  // Objetivo: próximo 1 de enero (cambia solo al cruzar Año Nuevo)
  const target = getNextNewYear(new Date(nowMs));

  const diffSec = Math.max(0, Math.floor((target.getTime() - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return (
    <div className="justify-center items-center p-5">
      <h2 className="text-5xl font-semibold text-center pb-4">
        Cuenta Regresiva para Año Nuevo
      </h2>

      <div className="coundown-container flex gap-4 justify-center items-center">
        <div className="countdown-el days-c">
          <p className="text-5xl font-bold" id="days">{pad2(days)}</p>
          <span>Días</span>
        </div>

        <div className="countdown-el hours-c">
          <p className="text-5xl font-bold" id="hours">{pad2(hours)}</p>
          <span>Horas</span>
        </div>

        <div className="countdown-el minutes-c">
          <p className="text-5xl font-bold" id="minutes">{pad2(minutes)}</p>
          <span>Minutos</span>
        </div>

        <div className="countdown-el seconds-c">
          <p className="text-5xl font-bold" id="seconds">{pad2(seconds)}</p>
          <span>Segundos</span>
        </div>
      </div>
    </div>
  );
};
