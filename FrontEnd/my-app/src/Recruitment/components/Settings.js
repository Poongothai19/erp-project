import React from "react";
import "../styles/Settings.css";

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <p>Manage your account and application settings here.</p>

      <div className="settings-section">
        <h3>Account Settings</h3>
        <label>
          Username: <input type="text" placeholder="Change username" />
        </label>
        <label>
          Email: <input type="email" placeholder="Change email" />
        </label>
        <label>
          Password: <input type="password" placeholder="New password" />
        </label>
        <button>Save Changes</button>
      </div>
    </div>
  );
};

export default Settings;
