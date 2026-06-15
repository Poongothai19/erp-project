import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ activeTab, onTabClick }) => {
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    onTabClick(tab);
    if (tab === "Groups") navigate("/Group");
    else if (tab === "Users") navigate("/Users");
    else if (tab === "Activate Users") navigate("/ActivateUsers");
    else if (tab === "Free Trial") navigate("/FreeTrial");
  };

  return (
    <div className="header pinned-header">
      <nav className="navbar">
        {["Users", "Groups", "Activate Users", "Free Trial"].map((tab) => (
          <span
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Navbar;
