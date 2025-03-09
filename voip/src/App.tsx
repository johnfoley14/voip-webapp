import "./App.css";
import Caller from "../lib/caller";
import Receiver from "../lib/recipient";
import { BrowserRouter, Routes, Route } from "react-router"; // Correct import for react-router-dom v6+
import ButtonComponent from "../ui_components/buttons";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route index element={<ButtonComponent />} />
          <Route path={"make-call"} element={<Caller />} />
          <Route path={"answer-call"} element={<Receiver />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
