import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import { type Cliente } from '@/services/db';
import { MdAdd, MdSearch } from 'react-icons/md';

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await ClienteService.getAll();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Clientes</h1>
          <p>Gerenciamento de clientes e contratos.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/clientes/novo')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <MdAdd size={20} /> Novo Cliente
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid var(--border-color)'
      }}>
        <MdSearch size={24} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Buscar cliente por nome, CPF ou cidade..."
          style={{
            flex: 1,
            border: 'none',
            background: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}
        />
      </div>

      {loading ? (
        <p>Carregando clientes...</p>
      ) : clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Nome</th>
                <th style={{ padding: '1rem' }}>Cidade</th>
                <th style={{ padding: '1rem' }}>Distribuidora</th>
                <th style={{ padding: '1rem' }}>Consumo</th>
                <th style={{ padding: '1rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{cliente.nome}</td>
                  <td style={{ padding: '1rem' }}>{cliente.cidade}</td>
                  <td style={{ padding: '1rem' }}>{cliente.distribuidora}</td>
                  <td style={{ padding: '1rem' }}>{cliente.consumoMedio} kWh</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--solar-orange)', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Clientes;
