/**
 *
 * @paraps
 */

import { useCountdown } from "../hooks/useCountdown";

const formartTime = (time: number) => {
  return time < 10 ? `0${time}` : time;
};

const newYear = "1 Jan 2025";
export const NewYear = () => {
  const newYearDate = new Date(newYear);
  const currentDate = new Date();

  const totalSeconds = Math.floor(
    (newYearDate.getTime() - currentDate.getTime()) / 1000
  );
  const seconds = useCountdown(
    Math.floor(totalSeconds) % 60,
    () => console.log("seconds = " + seconds),
    1000
  );

  const days = Math.floor(totalSeconds / 3600 / 24);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds / 60) % 60;

  return (
    <>
      <div className="justify-center items-center p-10 mt-12">
        <h1 className="text-6xl font-semibold text-center  pb-4">
          {" "}
          New Year Eve
        </h1>
        <div className="coundown-container flex gap-4 justify-center items-center ">
          <div className="countdown-el days-c">
            <p className="text-5xl font-bold" id="days">
              {" "}
              {formartTime(days)}
            </p>
            <span>Dias</span>
          </div>

          <div className="countdown-el hours-c">
            <p className="text-5xl font-bold" id="hours">
              {" "}
              {formartTime(hours)}
            </p>
            <span>Horas</span>
          </div>

          <div className="countdown-el minutes-c">
            <p className="text-5xl font-bold " id="minutes">
              {" "}
              {formartTime(minutes)}
            </p>
            <span>Minutos</span>
          </div>

          <div className="countdown-el seconds-c">
            <p className="text-5xl font-bold" id="seconds">
              {" "}
              {formartTime(seconds)}
            </p>
            <span>Segundos</span>
          </div>
        </div>
      </div>
    </>
  );
};
