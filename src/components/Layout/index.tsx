import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdAttachMoney,
  MdHistory,
  MdBarChart,
  MdSettings,
  MdMenu,
  MdDarkMode,
  MdLightMode,
  MdClose,
  MdFileUpload
} from 'react-icons/md';
import '@/styles/layout.css';

const Layout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`layout-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay for mobile */}
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>SolTracker</span>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <MdClose size={24} />
          </button>
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
          <NavLink to="/importacao" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <MdFileUpload size={24} />
            <span>Importação</span>
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
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <MdMenu size={24} />
            </button>
          </div>

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
