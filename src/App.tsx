import { FC } from "react";
import "./App.css";
import { NewYear } from "./components/NewYear";
const App: FC = () => {
  return (
    <div className="relative z-10 flex h-screen items-end justify-center text-white pb-10">
      <NewYear />
    </div>
  );
};

export default App;
