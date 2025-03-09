import React from "react";
import { Outlet, Link } from "react-router"; // Use react-router-dom for React Router v6+
import "../styles/ButtonComponent.css";

const ButtonComponent: React.FC = () => {
  return (
    <div className="button-container">
      <Link to="make-call">
        <button className="button">Make Call</button>
      </Link>
      <Link to="answer-call">
        <button className="button">Answer Call</button>
      </Link>
      <Outlet />
    </div>
  );
};

export default ButtonComponent;
