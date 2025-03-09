import React, { useState, useRef, useEffect } from "react";

const Caller: React.FC = () => {
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [offerSent, setOfferSent] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Establish WebSocket connection to the signaling server
    wsRef.current = new WebSocket("ws://localhost:3000");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      // Register the sender name (Tim) when the WebSocket connection is established
      wsRef.current?.send(JSON.stringify({ type: "register", name: "tim" }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "answer") {
        handleAnswer(message);
      } else if (message.type === "ice-candidate") {
        handleIceCandidate(message);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            to: "jim",
            candidate: event.candidate,
          })
        );
      }
    };

    return pc;
  };

  const createOffer = async () => {
    const pc = setupPeerConnection();
    peerConnectionRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send the offer to Jim
    wsRef.current?.send(
      JSON.stringify({
        type: "offer",
        to: "jim",
        offer: offer,
      })
    );

    setIsCalling(true);
    setOfferSent(true);
  };

  const handleAnswer = (message: any) => {
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  const handleIceCandidate = (message: any) => {
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
