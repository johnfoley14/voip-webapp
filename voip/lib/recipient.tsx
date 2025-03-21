import React, { useState, useRef, useEffect } from "react";

interface ReceiverProps {
  server_ip: string;
}

const Receiver: React.FC<ReceiverProps> = ({ server_ip }) => {
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket(`wss://${server_ip}:3000`);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      wsRef.current?.send(JSON.stringify({ type: "register", name: "jim" }));
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

  const setupPeerConnection = (): RTCPeerConnection => {
    console.log("Setting up RTCPeerConnection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: `stun:${server_ip}:3478` }],
      iceTransportPolicy: "all",
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        console.log("Using candidate: ", candidate);
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            to: "tim",
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
        console.log("Message received:", event.data);
        setReceivedMessage(event.data);
      };

      dataChannelRef.current = dataChannel;
    };
    return pc;
  };

  const handleOffer = async (message: any) => {
    console.log("Received offer from Tim:", message.offer);
    const pc = setupPeerConnection();
    peerConnectionRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsRef.current?.send(
      JSON.stringify({
        type: "answer",
        to: "tim",
        answer: answer,
      })
    );
    console.log("Sent answer to Tim");
  };

  const handleIceCandidate = (message: any) => {
    console.log("Received ICE candidate from Tim:", message.candidate);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  return (
    <div>
      <h1>Receiver (Jim)</h1>
      {!isConnected && <p>Waiting for connection...</p>}
      {isConnected && <p>Connected to Tim. You can receive messages!</p>}
      {receivedMessage && <p>Message from Tim: {receivedMessage}</p>}
    </div>
  );
};

export default Receiver;
