import React, { useState, useRef, useEffect } from "react";
import connectToSpeechToTextWebSocket from "../utils/web_socket_connect";
import { showNotification } from "../ui_components/notification";
import TranscriptViewer from "../ui_components/transcript_viewer";

interface CallerProps {
  server_ip: string;
  name: string;
}

const Caller: React.FC<CallerProps> = ({ server_ip, name }) => {
  const [users, setUsers] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [recipient, setRecipient] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");

  useEffect(() => {
    // connect to web socket signaling server
    wsRef.current = new WebSocket(`wss://${server_ip}:3000`);
    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      showNotification("Connected to signaling server");
      wsRef.current?.send(JSON.stringify({ type: "register", name: name }));
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
      // const response = await fetch(`https://${server_ip}:3000/get_users`);
      // const data = await response.json();
      // if (data.users) {
      //   setUsers(data.users.filter((user: string) => user !== name)); // Exclude self
      // }
      setUsers(["user1", "user2", "user3"]); // Mock data for testing
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const setupPeerConnection = (recipient: string): RTCPeerConnection => {
    console.log(`Setting up RTCPeerConnection with ${recipient}...`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: `stun:${server_ip}:3478` },
        {
          urls: `turn:${server_ip}:3478`,
          username: "unused",
          credential: "unused",
        },
      ],
      iceTransportPolicy: "all", // "relay" for turn only
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

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    const dataChannel = pc.createDataChannel("chat");
    dataChannel.onopen = () => {
      console.log("Data channel open!");
      showNotification(`Connected to ${recipient}`);
      setIsConnected(true);
    };

    dataChannelRef.current = dataChannel;
    connectToSpeechToTextWebSocket(dataChannelRef, setTranscript);
    return pc;
  };

  const createOffer = async (recipient: string) => {
    console.log(`Creating offer to ${recipient}...`);
    const pc = setupPeerConnection(recipient);
    setRecipient(recipient);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(
        JSON.stringify({
          type: "offer",
          sender: name,
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
      {!isConnected && (
        <>
          <h1>Call Peer</h1>
          <h2>Available Users:</h2>
          {users.length > 0 ? (
            users.map((user) => (
              <button
                className="button"
                key={user}
                onClick={() => createOffer(user)}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Call {user}
              </button>
            ))
          ) : (
            <p>No users available.</p>
          )}
        </>
      )}
      {isConnected && (
        <TranscriptViewer name={recipient} transcript={transcript} />
      )}
    </div>
  );
};

export default Caller;
