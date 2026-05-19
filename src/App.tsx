import { FC, useEffect, useRef, useState } from "react";
import "./App.css";
import { NewYear } from "./components/NewYear";

const THEME_STORAGE_KEY = "newyear-theme";
const SOUND_STORAGE_KEY = "newyear-sound";

const MusicOnIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className="control-icon"
  >
    <path
      d="M9 17.5a2 2 0 1 1-2-2c.42 0 .8.13 1.1.34V7.5l8-1.5v8.5a2 2 0 1 1-1-1.72V7.2l-6 1.12V17.5Z"
      fill="currentColor"
    />
  </svg>
);

const MusicOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className="control-icon"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M10 16.9a1.7 1.7 0 1 1-1.7-1.7c.29 0 .56.07.8.2V9.1l5.9-1.14v5.98a1.7 1.7 0 1 1-.9-1.5V9.04l-4.1.8v7.06Z"
      fill="currentColor"
    />
    <path
      d="M6.2 6.2 17.8 17.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const App: FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" ? "light" : "dark";
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  });
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      document.body.classList.add("home-ready");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.classList.remove("home-ready", "home-leaving");
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(
      SOUND_STORAGE_KEY,
      isSoundEnabled ? "on" : "off"
    );

    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    if (!isSoundEnabled && context.state === "running") {
      void context.suspend();
    }
  }, [isSoundEnabled]);

  const playSoftTick = () => {
    if (!isSoundEnabled) {
      return;
    }

    const context =
      audioContextRef.current ??
      new window.AudioContext();

    audioContextRef.current = context;
    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.06);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.12);
  };

  return (
    <div className="app-shell">
      <BackgroundFX />
      <header className="topbar">
        <div className="controls">
          <button
            className="control-btn icon-btn"
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            className="control-btn icon-btn"
            type="button"
            onClick={() => setIsSoundEnabled((prev) => !prev)}
            aria-label={
              isSoundEnabled ? "Silenciar sonido" : "Activar sonido"
            }
            title={isSoundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {isSoundEnabled ? <MusicOnIcon /> : <MusicOffIcon />}
          </button>
        </div>
      </header>

      <main className="hero-stage">
        <NewYear onSecondTick={playSoftTick} />
      </main>
    </div>
  );
};

const BackgroundFX = () => {
  const particles = Array.from({ length: 18 }, (_, index) => index);
  return (
    <div className="background-fx" aria-hidden="true">
      <div className="vignette" />
      <div className="nebula nebula-left" />
      <div className="nebula nebula-right" />
      <div className="particle-cloud">
        {particles.map((particle) => (
          <span key={particle} className="particle-dot" />
        ))}
      </div>
    </div>
  );
};

export default App;
