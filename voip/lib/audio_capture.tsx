import { useEffect } from "react";

const AudioCapture: React.FC = () => {
  useEffect(() => {
    const websocket = new WebSocket("ws://172.22.128.1:8000"); // Use correct server address

    websocket.onopen = () => {
      console.log("✅ WebSocket connection opened");
    };

    websocket.onmessage = (event) => {
      console.log("📩 Received from WebSocket:", event.data);
    };

    websocket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("🔌 WebSocket connection closed");
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorder.start(500); // Send chunks every 500ms

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && websocket.readyState === WebSocket.OPEN) {
            console.log("📤 Sending audio chunk to WebSocket...");
            websocket.send(event.data);
          }
        };
      })
      .catch((err) => console.error("Error accessing microphone:", err));

    return () => {
      websocket.close();
    };
  }, []);

  return (
    <div>
      <h1>Audio Capture</h1>
    </div>
  );
};

export default AudioCapture;
