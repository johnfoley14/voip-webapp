function connectToLocalWebSocket(): WebSocket {
    const socket = new WebSocket("ws://localhost:8765");
  
    socket.onopen = (): void => {
      console.log("✅ Connected to ws://localhost:8765");
    };
  
    socket.onmessage = (event: MessageEvent): void => {
      console.log("📥 Message received:", event.data);
    };
  
    socket.onerror = (error: Event): void => {
      console.error("⚠️ WebSocket error:", error);
    };
  
    socket.onclose = (event: CloseEvent): void => {
      console.log(`❌ WebSocket closed: code=${event.code}, reason=${event.reason}`);
    };
  
    return socket; // Return socket in case you want to use it later
  }
  
export default connectToLocalWebSocket;