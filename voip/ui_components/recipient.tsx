import React, { useState, useRef, useEffect } from "react";
import { showNotification } from "./notification";
import Spinner from "./spinner";
import TranscriptViewer from "./transcript_viewer";

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
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => console.log(data.message));

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      showNotification("Connected to signaling server");
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
      iceServers: [
        { urls: `stun:${server_ip}:3478` },
        {
          urls: `turn:${server_ip}:3478`,
          username: "unused",
          credential: "unused",
        },
      ],
      iceTransportPolicy: "all",
      // iceServers: [{ urls: `stun:3.254.201.195:3478` }],
      // iceServers: [{ urls: `stun:stun.l.google.com:19302` }],
      // iceTransportPolicy: "all",
    });
    console.log("Creating connection with: ", sender);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        console.log(`Sending candidate to ${sender}: `, candidate);
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
        showNotification(`Connected to caller ${caller}`);
        setIsConnected(true);
      };

      dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        message["recipient-posted-at"] = Date.now();

        fetch("http://localhost:5000/synthesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        });

        console.log("Message received:", message);
        setReceivedMessage((prev) => prev + message.transcript + "\n");
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
    console.log(`Sent answer to ${message.sender}`);
  };

  const handleIceCandidate = (message: any) => {
    console.log("Received ICE candidate: ", message.candidate);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  return (
    <div>
      {!isConnected && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Waiting for connection <Spinner />
        </p>
      )}
      {isConnected && (
        <TranscriptViewer name={caller} transcript={receivedMessage} />
      )}
    </div>
  );
};

export default Receiver;
