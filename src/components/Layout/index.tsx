import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdAttachMoney,
  MdHistory,
  MdBarChart,
  MdSettings,
  MdMenu,
  MdDarkMode,
  MdLightMode
} from 'react-icons/md';
import '@/styles/layout.css';

const Layout: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>SolTracker</span>
        </div>
        <nav className="sidebar-menu">
          <NavLink to="/" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdDashboard size={24} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/clientes" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdPeople size={24} />
            <span>Clientes</span>
          </NavLink>
          <NavLink to="/financeiro" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdAttachMoney size={24} />
            <span>Financeiro</span>
          </NavLink>
          <NavLink to="/historico" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdHistory size={24} />
            <span>Histórico</span>
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdBarChart size={24} />
            <span>Relatórios</span>
          </NavLink>
          <NavLink to="/configuracoes" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdSettings size={24} />
            <span>Configurações</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <MdMenu size={24} style={{ cursor: 'pointer' }} />

          <div className="user-profile">
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                marginRight: '1rem'
              }}
              title="Alternar Tema"
            >
              {isDarkMode ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
            </button>
            <span>Usuário</span>
          </div>
        </header>

        {/* Content */}
        <main className="content-area">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="footer">
          &copy; {new Date().getFullYear()} SolTracker - Rastreamento Solar
        </footer>
      </div>
    </div>
  );
};

export default Layout;
