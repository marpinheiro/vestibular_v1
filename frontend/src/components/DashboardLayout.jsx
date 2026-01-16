import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/plano-estudos', icon: '📚', label: 'Plano de Estudos' },
    { path: '/questoes', icon: '❓', label: 'Questões' },
    { path: '/redacoes', icon: '✍️', label: 'Redações' },
    { path: '/simulados', icon: '📝', label: 'Simulados' },
    { path: '/progresso', icon: '📊', label: 'Progresso' },
    { path: '/configuracoes', icon: '⚙️', label: 'Configurações' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-logo">SempreAprender</h1>
          <button className="sidebar-close" onClick={closeSidebar}>
            ✕
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-level">Nível {user?.level || 1}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>

          <div className="header-title">
            <h2>
              {menuItems.find((item) => item.path === location.pathname)
                ?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="header-actions">
            <div className="user-stats">
              <div className="stat-badge">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{user?.xp || 0}</span>
              </div>
              <div className="stat-badge">
                <span className="stat-icon">🪙</span>
                <span className="stat-value">{user?.coins || 0}</span>
              </div>
              <div className="stat-badge">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{user?.streak_days || 0}</span>
              </div>
            </div>

            <div className="header-user">
              <div className="user-avatar-small">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
