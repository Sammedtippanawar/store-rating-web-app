import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import UserDashboard from './pages/UserDashboard';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
        {authPage === 'login'
          ? <Login onSuccess={() => {}} onSignup={() => setAuthPage('signup')} />
          : <Signup onSuccess={() => {}} onLogin={() => setAuthPage('login')} />
        }
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
          {currentPage === 'settings' && <Settings />}
          {currentPage !== 'settings' && user.role === 'admin' && (
            <AdminDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}
          {currentPage !== 'settings' && user.role === 'store_owner' && (
            <StoreOwnerDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}
          {currentPage !== 'settings' && user.role === 'user' && (
            <UserDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
