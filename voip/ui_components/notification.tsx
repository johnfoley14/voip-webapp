import React, { useState, useEffect } from "react";
import "../styles/notification.css";

let showNotificationExternal: ((msg: string) => void) | null = null;

const Notification: React.FC = () => {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showNotificationExternal = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };
  }, []);

  if (!visible) return null;

  return <div className="notification">{message}</div>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const showNotification = (msg: string) => {
  showNotificationExternal?.(msg);
};

export default Notification;
