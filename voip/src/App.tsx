import "./App.css";
import AudioCapture from "../lib/audio_capture";
import MakeConnection from "../lib/connection";
const getaudio = false;
import { BrowserRouter, Routes, Route } from "react-router"; // Correct import for react-router-dom v6+
import ButtonComponent from "../ui_components/buttons";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {getaudio ? <AudioCapture /> : null}

        <Routes>
          <Route index element={<ButtonComponent />} />
          <Route path={"MakeCall"} element={<MakeConnection />} />
          <Route path={"AnswerCall"} element={<MakeConnection />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
