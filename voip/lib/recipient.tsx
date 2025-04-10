import React, { useState, useRef, useEffect } from "react";

interface ReceiverProps {
  server_ip: string;
  name: string;
}

const Receiver: React.FC<ReceiverProps> = ({ server_ip, name }) => {
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [caller, setCaller] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket(`wss://${server_ip}:3000`);

    // Load text-to-speech model as soon as client starts listening
    fetch("http://localhost:5000/load_model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello world" }),
    })
      .then((r) => r.json())
      .then((data) => console.log(data.message));

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      wsRef.current?.send(JSON.stringify({ type: "register", name: name }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "offer") {
        handleOffer(message);
      } else if (message.type === "ice-candidate") {
        handleIceCandidate(message);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const setupPeerConnection = (sender: string): RTCPeerConnection => {
    console.log("Setting up RTCPeerConnection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: `stun:${server_ip}:3478` }],
      iceTransportPolicy: "all",
    });
    console.log("sender: ", sender);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        console.log("Using candidate: ", candidate);
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            to: sender,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ondatachannel = (event) => {
      console.log("Data channel received!");
      const dataChannel = event.channel;

      dataChannel.onopen = () => {
        console.log("Data channel open!");
        setIsConnected(true);
      };

      dataChannel.onmessage = (event) => {
        fetch("http://localhost:5000/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Hello world" }),
        });
        console.log("Message received:", event.data);
        const message = JSON.parse(event.data);
        setReceivedMessage((prev) => prev + "\n" + message.transcript);
      };

      dataChannelRef.current = dataChannel;
    };
    return pc;
  };

  const handleOffer = async (message: any) => {
    setCaller(message.sender);
    console.log(`Received offer from ${message.sender}:`, message.offer);

    const pc = setupPeerConnection(message.sender);
    peerConnectionRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsRef.current?.send(
      JSON.stringify({
        type: "answer",
        to: message.sender,
        answer: answer,
      })
    );
    console.log(`Sent answer to ${caller}`);
  };

  const handleIceCandidate = (message: any) => {
    console.log(`Received ICE candidate from ${caller}`, message.candidate);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  return (
    <div>
      <h1>Receiver ({name})</h1>
      {!isConnected && <p>Waiting for connection...</p>}
      {isConnected && <p>Connected to {caller}. You can receive messages!</p>}
      {receivedMessage && <p>Message: {receivedMessage}</p>}
    </div>
  );
};

export default Receiver;
