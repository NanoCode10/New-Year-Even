import { FC } from "react";
import "./App.css";
import { NewYear } from "./components/NewYear";
const App: FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-6xl font-bold text-center mb-6 text-blue-900">NanoCode10 Web App 💪</h1>
      </header>
      <Content />
    </div>
  );
};

const Content = () => {
  return (
    <div className="relative z-10 flex h-screen items-center justify-center text-white pb-20">

      <NewYear />
    </div>
  );
};

export default App;
