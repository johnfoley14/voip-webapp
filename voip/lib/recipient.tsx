import React, { useState, useRef, useEffect } from "react";

const Receiver: React.FC = () => {
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    console.log("Connecting to WebSocket signaling server...");
    wsRef.current = new WebSocket("wss://52.208.237.220:3000");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      wsRef.current?.send(JSON.stringify({ type: "register", name: "jim" }));
    };

    wsRef.current.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
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
        console.log("Sending ICE candidate to Tim:", event.candidate);
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
      console.log("Received remote track:", event.streams[0]);
      const remoteStream = event.streams[0];
      const remoteVideo = document.getElementById(
        "remoteVideo"
      ) as HTMLVideoElement;
      remoteVideo.srcObject = remoteStream;
    };

    pc.onconnectionstatechange = () => {
      console.log("PeerConnection state changed:", pc.connectionState);
    };

    return pc;
  };

  const handleOffer = async (message: any) => {
    console.log("Received offer from Tim:", message.offer);
    const pc = setupPeerConnection();
    peerConnectionRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
    console.log("Set remote description");

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("Created and set local description for answer");

    wsRef.current?.send(
      JSON.stringify({
        type: "answer",
        to: "tim",
        answer: answer,
      })
    );

    console.log("Sent answer to Tim");
    setIsReceiving(true);
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
