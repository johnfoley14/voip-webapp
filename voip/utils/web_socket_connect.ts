import React from "react";
import { showNotification } from "../ui_components/notification";

function connectToSpeechToTextWebSocket(
  dataChannelRef: React.RefObject<RTCDataChannel>,
  setTranscript: React.Dispatch<React.SetStateAction<string>>
): WebSocket {
  const stt_ws = "ws://localhost:8765";
  const socket = new WebSocket(stt_ws);

  socket.onopen = (): void => {
    console.log(`✅ Connected to speech-to-text server at ${stt_ws}`);
    showNotification("Connected to local speech-to-text service");
  };

  socket.onmessage = (event: MessageEvent): void => {
    const data = JSON.parse(event.data);
    data["caller-posted-at"] = Date.now()
    console.log("📥 From STT service: ", data);

    if (data.transcript) {
      setTranscript(prev => prev + data.transcript + '\n');
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.send(JSON.stringify(data));
    }
  };

  socket.onerror = (error: Event): void => {
    console.error("⚠️ WebSocket error:", error);
  };

  socket.onclose = (event: CloseEvent): void => {
    console.log(`❌ WebSocket closed: code=${event.code}, reason=${event.reason}`);
  };

  return socket;
}

export default connectToSpeechToTextWebSocket;