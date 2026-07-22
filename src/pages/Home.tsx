import React from 'react';

const Home: React.FC = () => {
  return (
    <div style={{ textAlign: 'left' }}>
      <h1>Dashboard Solar</h1>
      <p style={{ marginBottom: '2rem' }}>Resumo do sistema de rastreamento solar.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--solar-yellow)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Energia Gerada</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>124.5 kWh</p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--solar-orange)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status do Sistema</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>Ativo</p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--solar-gray-700)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Eficiência</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>98%</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
