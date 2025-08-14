import { FC } from "react";
import "./App.css";
import { NewYear } from "./components/NewYear";

const App: FC = () => {
  return (
    <div className="App">
      <Header />
      <main className="relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center text-white pb-20">
        <Content />
      </main>
    </div>
  );
};

const Header = () => {
  // Elegí UNO de los gradientes de abajo y pegalo en `GRADIENTE_AQUI`
  const gradient =
    // 1) Violeta intenso
    "bg-gradient-to-r from-violet-300 via-fuchsia-400 to-rose-400";
  // 2) Rojo fuego
  // "bg-gradient-to-r from-rose-300 via-red-500 to-orange-400";
  // 3) Magenta eléctrico
  // "bg-gradient-to-r from-fuchsia-300 via-pink-500 to-rose-400";
  // 4) Morado -> Cian (alto contraste)
  // "bg-gradient-to-r from-purple-300 via-violet-400 to-cyan-300";

  return (
    <header className="pt-10">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span
            className={`${gradient} bg-clip-text text-transparent drop-shadow-[0_1px_10px_rgba(255,255,255,0.15)]`}
          >
            NanoCode10 Web App
          </span>
        </h1>
        <div className="mx-auto mt-3 h-px w-64 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <p className="mt-3 text-sm sm:text-base text-white/70">
          Proyectos • Dev • Infra • Linux
        </p>
      </div>
    </header>
  );
};

const Content = () => {
  return (
    <div className="relative z-10">
      <NewYear />
    </div>
  );
};

export default App;
