import "./App.css";
import AudioCapture from "../lib/audio_capture";
import MakeConnection from "../lib/connection";
const getaudio = false;

function App() {
  return (
    <div>
      {getaudio ? <AudioCapture /> : null}
      <MakeConnection />
    </div>
  );
}

export default App;
