import React from "react";
import "./App.css";
import Caller from "../lib/caller";
import Receiver from "../lib/recipient";
import { BrowserRouter, Routes, Route } from "react-router";
import ButtonComponent from "../ui_components/buttons";

const SYSTEM_HASH =
  "57a008896c76ea83b5a1bf79426c1e7905e80da05e7c5b057039c2caeceae06a";

const server_ip = "3.254.201.195";

// Function to hash input using SHA-256
async function hashInput(input: any) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function App() {
  const [name, setName] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [authenticated, setAuthenticated] = React.useState(false);

  const handleButtonClick = async () => {
    const hashedInput = await hashInput(inputValue);
    if (hashedInput === SYSTEM_HASH) {
      setAuthenticated(true);
    } else {
      alert("Invalid hash. Access denied.");
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        {authenticated ? (
          <Routes>
            <Route index element={<ButtonComponent />} />
            <Route
              path={"make-call"}
              element={<Caller server_ip={server_ip} name={name} />}
            />
            <Route
              path={"answer-call"}
              element={<Receiver server_ip={server_ip} name={name} />}
            />
          </Routes>
        ) : (
          <div className="button-container">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter server secret"
            />
            <button className="button" onClick={handleButtonClick}>
              Submit
            </button>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
