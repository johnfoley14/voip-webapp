import React from "react";

function connectToSpeechToTextWebSocket(dataChannelRef: React.RefObject<RTCDataChannel>): WebSocket {
    const stt_ws = "ws://localhost:8765"
    const socket = new WebSocket(stt_ws);
  
    socket.onopen = (): void => {
      console.log(`✅ Connected to speech-to-text server at ${stt_ws}`);
    };
  
    socket.onmessage = (event: MessageEvent): void => {
      console.log("📥 Message received:", event.data);
      if (dataChannelRef.current) {
        dataChannelRef.current.send(event.data);
      }
    };
  
    socket.onerror = (error: Event): void => {
      console.error("⚠️ WebSocket error:", error);
    };
  
    socket.onclose = (event: CloseEvent): void => {
      console.log(`❌ WebSocket closed: code=${event.code}, reason=${event.reason}`);
    };
  
    return socket; // Return socket in case you want to use it later
  }

export default connectToSpeechToTextWebSocket;