import React from "react";
import "./App.css";
import Caller from "../ui_components/caller";
import Receiver from "../ui_components/recipient";
import { BrowserRouter, Routes, Route } from "react-router";
import ButtonComponent from "../ui_components/buttons";
import Notification, { showNotification } from "../ui_components/notification";
import ProfileIcon from "../ui_components/profile_icon";

const server_ip = "3.254.201.195";

const SYSTEM_HASH =
  "57a008896c76ea83b5a1bf79426c1e7905e80da05e7c5b057039c2caeceae06a";

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
      showNotification("Successfully authenticated");
    } else {
      showNotification("Invalid server secret");
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        {authenticated ? (
          <div>
            <ProfileIcon name={name} />
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
          </div>
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
        <Notification />
      </div>
    </BrowserRouter>
  );
}

export default App;
