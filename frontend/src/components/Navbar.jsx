import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar({ onNavigate }) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>RateHub</h1>
          <p>Professional Store Rating Platform</p>
        </div>
        <div className="navbar-right">
          {user && (
            <>
              <span className="user-name">{user.name}</span>
              <button className="profile-btn" onClick={() => setShowMenu(!showMenu)}>
                <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
              </button>
              {showMenu && (
                <div className="menu-dropdown">
                  <div className="menu-item">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  <hr />
                  <button className="menu-item" onClick={() => { onNavigate('settings'); setShowMenu(false); }}>
                    Settings
                  </button>
                  <button className="menu-item logout-btn" onClick={() => { logout(); setShowMenu(false); }}>
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
