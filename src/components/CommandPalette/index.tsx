import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdPerson, MdAttachMoney, MdHistory, MdStar } from 'react-icons/md';
import { ClienteService } from '@/services/clienteService';
import { type Cliente } from '@/services/db';

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      ClienteService.getAll().then(setClientes);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      c.documento.includes(q) ||
      c.cidade.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query, clientes]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <MdSearch /> },
    { name: 'Clientes', path: '/clientes', icon: <MdPerson /> },
    { name: 'Financeiro', path: '/financeiro', icon: <MdAttachMoney /> },
    { name: 'Histórico', path: '/historico', icon: <MdHistory /> },
  ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 5000, display: 'flex', justifyContent: 'center', paddingTop: '10vh'
        }}
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            backgroundColor: 'var(--surface-color)',
            width: '100%',
            maxWidth: '600px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)',
            height: 'fit-content',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <MdSearch size={24} color="var(--solar-orange)" style={{ marginRight: '10px' }} />
            <input
              autoFocus
              placeholder="Pesquisa inteligente (Clientes, Páginas, Comandos...)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1.1rem'
              }}
            />
            <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              ESC
            </div>
          </div>

          <div style={{ padding: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {query && (
              <>
                {results.length > 0 && (
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--solar-orange)', textTransform: 'uppercase' }}>Clientes</div>
                )}
                {results.map(c => (
                  <div
                    key={c.id}
                    className="menu-item"
                    onClick={() => { navigate(`/clientes/${c.id}`); setIsOpen(false); }}
                    style={{ borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem' }}
                  >
                    {c.isFavorito ? <MdStar color="var(--solar-yellow)" /> : <MdPerson />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{c.nome}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{c.cidade} • {c.documento}</div>
                    </div>
                  </div>
                ))}

                {navItems.length > 0 && (
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--solar-orange)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Navegação</div>
                )}
                {navItems.map(item => (
                  <div
                    key={item.path}
                    className="menu-item"
                    onClick={() => { navigate(item.path); setIsOpen(false); }}
                    style={{ borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem' }}
                  >
                    {item.icon}
                    <span>Ir para {item.name}</span>
                  </div>
                ))}
              </>
            )}

            {!query && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>Digite algo para começar a busca inteligente...</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px' }}>Ctrl + K</span>
                  <span style={{ fontSize: '0.8rem' }}>para abrir em qualquer lugar</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
