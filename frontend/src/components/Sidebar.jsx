import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
  </svg>
);

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    if (!user) return [];
    if (user.role === 'admin') return [
      { id: 'dashboard', label: 'Dashboard', icon: '▦' },
      { id: 'users', label: 'Users', icon: '👤' },
      { id: 'stores', label: 'Stores', icon: '🏬' },
      { id: 'ratings', label: 'Ratings', icon: '★' },
    ];
    if (user.role === 'store_owner') return [
      { id: 'dashboard', label: 'Dashboard', icon: '▦' },
      { id: 'my-stores', label: 'My Stores', icon: '🏬' },
      { id: 'reviews', label: 'Reviews', icon: '★' },
    ];
    return [
      { id: 'dashboard', label: 'Dashboard', icon: '▦' },
      { id: 'stores', label: 'Browse Stores', icon: '🔍' },
      { id: 'my-ratings', label: 'My Ratings', icon: '★' },
    ];
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <h2>RateHub</h2>
          <p>Store Ratings</p>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <strong>{user?.name}</strong>
          <small>
            {user?.role === 'admin' ? 'Administrator' :
             user?.role === 'store_owner' ? 'Store Owner' : 'Customer'}
          </small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {getMenuItems().map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}></div>
        <button
          className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
          style={{ marginTop: 8 }}
        >
          <span className="icon">⚙</span>
          <span className="label">Settings</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <span className="icon">→</span>
          <span className="label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
