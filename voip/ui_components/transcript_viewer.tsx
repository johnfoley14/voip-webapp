import React, { useEffect, useRef } from "react";

interface Props {
  name: string;
  transcript: string;
}

const TranscriptViewer: React.FC<Props> = ({ name, transcript }) => {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div
      style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "60%",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h3 style={{ marginBottom: "16px" }}>Connected to {name}</h3>
      <div
        ref={transcriptRef}
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          background: "#f0f0f0",
          padding: "10px",
          borderRadius: "8px",
          whiteSpace: "pre-wrap",
          boxShadow: "0 0 6px rgba(0,0,0,0.1)",
        }}
      >
        {transcript}
      </div>
    </div>
  );
};

export default TranscriptViewer;
