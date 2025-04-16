import React from "react";
import "../styles/profile_icon.css";

interface Props {
  name: string;
}

const ProfileIcon: React.FC<Props> = ({ name }) => {
  return (
    <div className="profile-container">
      <div className="profile-icon">
        <span role="img" aria-label="profile">
          👤
        </span>
        <span>{name}</span>
      </div>
    </div>
  );
};

export default ProfileIcon;
