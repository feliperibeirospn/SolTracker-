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
  MdFileUpload,
  MdCloudSync,
  MdCloudDone,
  MdSearch
} from 'react-icons/md';
import '@/styles/layout.css';
import { useSync } from '@/hooks/useSync';
import { useNotifications } from '@/hooks/useNotifications';
import CommandPalette from '../CommandPalette';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isOnline } = useSync();
  useNotifications(); // Ativa as notificações ao carregar o layout principal
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

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`layout-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <CommandPalette />

      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>SolTracker</span>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Quick Search Shortcut Indicator in Sidebar */}
        <div
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          style={{
            margin: '0 1rem 1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--sidebar-hover)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem'
          }}
        >
          <MdSearch size={20} color="var(--solar-yellow)" />
          <span className="desktop-only">Busca Rápida</span>
          <div className="desktop-only" style={{ marginLeft: 'auto', padding: '2px 6px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', fontSize: '0.65rem' }}>Ctrl K</div>
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

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <MdMenu size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: isOnline ? '#28a745' : '#dc3545' }}>
              {isOnline ? <MdCloudDone size={18} /> : <MdCloudSync size={18} />}
              <span className="desktop-only">{isOnline ? 'Sincronizado' : 'Offline'}</span>
            </div>
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

        <main className="content-area">
          <Outlet />
        </main>

        <footer className="footer">
          &copy; {new Date().getFullYear()} SolTracker - Rastreamento Solar
        </footer>
      </div>
    </div>
  );
};

export default Layout;
