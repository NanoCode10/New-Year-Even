import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEventHandler,
} from "react";
import { useCountdown } from "../hooks/useCountdown";
import { getNextNewYear, pad2 } from "../utils/date";
import mascotImage from "../../mascota.png";

type NewYearProps = {
  onSecondTick?: () => void;
};

export const NewYear = ({ onSecondTick }: NewYearProps) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [pointer, setPointer] = useState({ x: 0, y: 0, active: false });
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const [isNavigatingToGame, setIsNavigatingToGame] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const navigateTimeoutRef = useRef<number | null>(null);

  useCountdown(
    1,
    () => {
      setNowMs(Date.now());
      onSecondTick?.();
    },
    1000
  );

  const target = getNextNewYear(new Date(nowMs));
  const diffSec = Math.max(0, Math.floor((target.getTime() - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const heroTagline = isMascotHovered
    ? "MODO NANO ACTIVADO."
    : "CUENTA REGRESIVA OFICIAL.";
  const heroSubcopy = isMascotHovered
    ? "Desarrollador de software activado."
    : "Desarrollador de apps y experiencias web, con foco en rendimiento, claridad y producto.";
  const gameHref = new URL(
    `${import.meta.env.BASE_URL}juego/index.html`,
    window.location.origin
  ).toString();

  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

  const cardStyle = useMemo(
    () =>
      ({
        "--tilt-x": `${pointer.active ? pointer.y * -5 : 0}deg`,
        "--tilt-y": `${pointer.active ? pointer.x * 7 : 0}deg`,
        "--glow-x": `${50 + pointer.x * 20}%`,
        "--glow-y": `${45 + pointer.y * 20}%`,
        "--hero-accent": isMascotHovered ? "var(--accent-main)" : "var(--accent-warm)",
      }) as CSSProperties,
    [isMascotHovered, pointer]
  );

  const handlePointerMove: PointerEventHandler<HTMLElement> = (event) => {
    if (!heroRef.current) {
      return;
    }

    const rect = heroRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer({ x, y, active: true });
  };

  const handleGameClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (isNavigatingToGame) {
      return;
    }

    document.body.classList.add("home-leaving");
    setIsNavigatingToGame(true);
    navigateTimeoutRef.current = window.setTimeout(() => {
      window.location.assign(gameHref);
    }, 720);
  };

  return (
    <section
      ref={heroRef}
      className={`newyear-hero ${isMascotHovered ? "is-hovered" : ""} ${isNavigatingToGame ? "is-leaving" : ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0, active: false })}
      style={cardStyle}
    >
      <div
        className={`mascot-stage ${isMascotHovered ? "is-hovered" : ""}`}
        onPointerEnter={() => setIsMascotHovered(true)}
        onPointerLeave={() => setIsMascotHovered(false)}
      >
        <div className="mascot-halo" />
        <figure className="mascot-frame">
          <img
            src={mascotImage}
            alt="Mascota central del evento"
            className="mascot-image"
          />
        </figure>
      </div>

      <div className="hero-copy">
        <p className="watermark">NanoCode10</p>
        <p className="watermark-subline">Proyectos • Dev • Infra • Linux</p>
        <p className="eyebrow">{heroTagline}</p>
        <p className="hero-subcopy">{heroSubcopy}</p>
      </div>

      <div
        className="countdown-grid"
        id="countdown"
        role="timer"
        aria-label="Cuenta regresiva a Año Nuevo"
      >
        <div className="countdown-el days-c">
          <p className="count-value" id="days">
            {pad2(days)}
          </p>
          <span className="count-label">Días</span>
        </div>

        <div className="countdown-el hours-c">
          <p className="count-value" id="hours">
            {pad2(hours)}
          </p>
          <span className="count-label">Horas</span>
        </div>

        <div className="countdown-el minutes-c">
          <p className="count-value" id="minutes">
            {pad2(minutes)}
          </p>
          <span className="count-label">Minutos</span>
        </div>

        <div className="countdown-el seconds-c" key={seconds}>
          <p className="count-value" id="seconds">
            {pad2(seconds)}
          </p>
          <span className="count-label">Segundos</span>
        </div>
      </div>

      <a className="news-pill" href="#post-info">
        <span className="news-badge">NEW</span>
        <span>Ir al post de info</span>
        <span className="news-arrow">→</span>
      </a>

      <a
        className={`game-cta ${isNavigatingToGame ? "is-activating" : ""}`}
        href={gameHref}
        onClick={handleGameClick}
        aria-label="Abrir el juego NanoCode Dash"
      >
        <span className="game-cta-badge">HOT</span>
        <span className="game-cta-copy">
          <strong>Jugar</strong>
          <span>Entrar a NanoCode Dash</span>
        </span>
        <span className="game-cta-arrow">→</span>
      </a>

      <section className="info-post" id="post-info">
        <h3>Post de info</h3>
        <p>Acá después podemos conectar novedades, changelog o un link real.</p>
      </section>
    </section>
  );
};
