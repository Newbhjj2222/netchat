import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ➕ ongeraho iyi line
import './Header.css';

const Header = ({ setActivePage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate(); // ➕ ongeraho navigation hook

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSelect = (page) => {
    setActivePage(page);
    setMenuOpen(false);

    if (page === "home") {
      navigate("/"); // 👉 ujya kuri route nyamukuru
    }
  };

  return (
    <header className="app-header">
      <div className="logo">NetChat</div>

      <input
        type="text"
        className="search-input"
        placeholder="Search chats or contacts"
      />

      <div className="menu-icon" onClick={toggleMenu}>☰</div>

      {menuOpen && (
        <div className="dropdown-menu">
          <div className="menu-item" onClick={() => handleSelect("home")}>🏠 Home</div>
          <div className="menu-item" onClick={() => handleSelect("chat")}>💬 Chat</div>
          <div className="menu-item" onClick={() => handleSelect("status")}>📷 Status</div>
          <div className="menu-item" onClick={() => handleSelect("group")}>👥 Group</div>
          <div className="menu-item" onClick={() => handleSelect("settings")}>⚙️ Profile</div>

          <a
            href="https://dash-nine-rho.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="menu-item link-item"
          >
            🌐 NetBoard
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
