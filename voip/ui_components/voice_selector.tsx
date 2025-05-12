// VoiceSelector.tsx
import React, { useState } from "react";

const voices = ["af_heart", "af_bella", "am_fenrir", "am_michael"];

const VoiceSelector: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<string>("af_heart");

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voice = e.target.value;
    setSelectedVoice(voice);

    try {
      const response = await fetch("http://localhost:5000/set_voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voice }),
      });

      const data = await response.json();
      console.log("Server response:", data);
    } catch (error) {
      console.error("Failed to set voice:", error);
    }
  };

  const style: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "#007BFF",
    color: "white",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
  };

  return (
    <select value={selectedVoice} onChange={handleChange} style={style}>
      {voices.map((voice) => (
        <option key={voice} value={voice}>
          {voice}
        </option>
      ))}
    </select>
  );
};

export default VoiceSelector;
