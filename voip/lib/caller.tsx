import React, { useState, useRef, useEffect } from "react";

const Caller: React.FC = () => {
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [offerSent, setOfferSent] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    console.log("Connecting to WebSocket signaling server...");
    wsRef.current = new WebSocket("wss://52.208.237.220:3000");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      wsRef.current?.send(JSON.stringify({ type: "register", name: "tim" }));
    };

    wsRef.current.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      const message = JSON.parse(event.data);
      if (message.type === "answer") {
        handleAnswer(message);
      } else if (message.type === "ice-candidate") {
        handleIceCandidate(message);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Closing WebSocket...");
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupPeerConnection = (): RTCPeerConnection => {
    console.log("Setting up RTCPeerConnection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate to Jim:", event.candidate);
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            to: "jim",
            candidate: event.candidate,
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PeerConnection state changed:", pc.connectionState);
    };

    return pc;
  };

  const createOffer = async () => {
    console.log("Creating offer...");
    const pc = setupPeerConnection();
    peerConnectionRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Got local media stream");

      stream.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind);
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("Sending offer to Jim:", offer);
      wsRef.current?.send(
        JSON.stringify({
          type: "offer",
          to: "jim",
          offer: offer,
        })
      );

      setIsCalling(true);
      setOfferSent(true);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const handleAnswer = (message: any) => {
    console.log("Received answer from Jim:", message.answer);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  const handleIceCandidate = (message: any) => {
    console.log("Received ICE candidate from Jim:", message.candidate);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  return (
    <div>
      <h1>Caller (Tim)</h1>
      {!isCalling && !offerSent && (
        <button onClick={createOffer}>Call Jim</button>
      )}
      {isCalling && <p>Calling Jim...</p>}
      {offerSent && <p>Offer sent to Jim!</p>}
    </div>
  );
};

export default Caller;
