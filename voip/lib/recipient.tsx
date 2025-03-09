import React, { useState, useRef, useEffect } from "react";

const Receiver: React.FC = () => {
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Establish WebSocket connection to the signaling server
    wsRef.current = new WebSocket("wss://52.208.237.220:3000");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      // Register the recipient name (Jim)
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
            to: "tim",
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const remoteVideo = document.getElementById(
        "remoteVideo"
      ) as HTMLVideoElement;
      remoteVideo.srcObject = remoteStream;
    };

    return pc;
  };

  const handleOffer = async (message: any) => {
    const pc = setupPeerConnection();
    peerConnectionRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send the answer to Tim
    wsRef.current?.send(
      JSON.stringify({
        type: "answer",
        to: "tim",
        answer: answer,
      })
    );

    setIsReceiving(true);
  };

  const handleIceCandidate = (message: any) => {
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  return (
    <div>
      <h1>Receiver (Jim)</h1>
      {!isReceiving && <p>Waiting for call...</p>}
      {isReceiving && !isAccepted && (
        <div>
          <p>Call received from Tim. Accept?</p>
          <button onClick={() => setIsAccepted(true)}>Accept</button>
        </div>
      )}
      {isAccepted && <p>Call Accepted!</p>}
      <video id="remoteVideo" autoPlay playsInline width="300" height="200" />
    </div>
  );
};

export default Receiver;
