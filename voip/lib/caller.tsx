import React, { useState, useRef, useEffect } from "react";
import connectToLocalWebSocket from "../utils/web_socket_connect";

interface CallerProps {
  server_ip: string;
}

const Caller: React.FC<CallerProps> = ({ server_ip }) => {
  const [users, setUsers] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    // connect to web socket signaling server
    wsRef.current = new WebSocket(`wss://${server_ip}:3000`);
    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
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

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    fetchUsers(); // Fetch users when the component loads

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      // const response = await fetch("https://52.208.237.220:3000/get_users");
      // const data = await response.json();
      // if (data.users) {
      //   setUsers(data.users.filter((user: string) => user !== "tim")); // Exclude self
      // }
      setUsers(["jim", "bob", "alice"]);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const setupPeerConnection = (recipient: string): RTCPeerConnection => {
    console.log(`Setting up RTCPeerConnection with ${recipient}...`);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: `stun:${server_ip}:3478` }],
      iceTransportPolicy: "all",
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        console.log("Using candidate:", candidate);
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            to: recipient,
            candidate: event.candidate,
          })
        );
      }
    };

    const dataChannel = pc.createDataChannel("chat");
    dataChannel.onopen = () => {
      console.log("Data channel open!");
      setIsConnected(true);
    };

    dataChannel.onmessage = (event) => {
      console.log("Message received:", event.data);
      setReceivedMessage(event.data);
    };

    dataChannelRef.current = dataChannel;
    return pc;
  };

  const createOffer = async (recipient: string) => {
    console.log(`Creating offer to ${recipient}...`);
    const pc = setupPeerConnection(recipient);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("connecting to ws");
      connectToLocalWebSocket(); // This function is not defined
      wsRef.current?.send(
        JSON.stringify({
          type: "offer",
          to: recipient,
          offer: offer,
        })
      );
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const handleAnswer = (message: any) => {
    console.log("Received answer:", message.answer);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  const handleIceCandidate = (message: any) => {
    console.log("Received ICE candidate:", message.candidate);
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  const sendMessage = () => {
    if (dataChannelRef.current && message.trim() !== "") {
      dataChannelRef.current.send(message);
      console.log("Message sent:", message);
      setMessage("");
    }
  };

  return (
    <div>
      <h1>Call Peer</h1>
      <h2>Available Users:</h2>
      {users.length > 0 ? (
        users.map((user) => (
          <button
            className="button"
            key={user}
            onClick={() => createOffer(user)}
          >
            Call {user}
          </button>
        ))
      ) : (
        <p>No users available.</p>
      )}
      {isConnected && (
        <div className="button-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button className="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      )}
      {receivedMessage && <p>Message received: {receivedMessage}</p>}
    </div>
  );
};

export default Caller;
