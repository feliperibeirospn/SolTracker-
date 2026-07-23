import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente } from '@/services/db';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdChevronLeft, MdChevronRight, MdSort } from 'react-icons/md';
import { subMonths, startOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Skeleton from '@/components/Skeleton';

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Cliente>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      // Pequeno delay para o skeleton ser visível
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await ClienteService.delete(id);
      loadClientes();
    }
  };

  const handleSort = (field: keyof Cliente) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and Sorted Data
  const filteredAndSortedClientes = useMemo(() => {
    return clientes
      .filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento.includes(searchTerm) ||
        c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (!valA || !valB) return 0;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clientes, searchTerm, sortField, sortDirection]);

  // Paginated Data
  const totalPages = Math.ceil(filteredAndSortedClientes.length / itemsPerPage);
  const paginatedClientes = filteredAndSortedClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Clientes</h1>
          <p>Gerenciamento de clientes e contratos.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const testData: any[] = [
                { nome: 'João Solar', telefone: '(11) 98888-7777', documento: '123.456.789-01', email: 'joao@solar.com', cidade: 'São Paulo', distribuidora: 'Enel', consumoMedio: 350, saldoAtual: 0, valorMensal: 150, percentualDesconto: 20, dataInicio: new Date(), dataCadastro: new Date() },
                { nome: 'Maria Painel', telefone: '(21) 97777-6666', documento: '987.654.321-09', email: 'maria@paineis.com', cidade: 'Rio de Janeiro', distribuidora: 'Light', consumoMedio: 450, saldoAtual: 50, valorMensal: 200, percentualDesconto: 15, dataInicio: new Date(), dataCadastro: new Date() },
                { nome: 'Carlos Energia', telefone: '(31) 96666-5555', documento: '456.123.789-05', email: 'carlos@energia.com', cidade: 'Belo Horizonte', distribuidora: 'Cemig', consumoMedio: 280, saldoAtual: -20, valorMensal: 120, percentualDesconto: 10, dataInicio: new Date(), dataCadastro: new Date() },
                { nome: 'Ana Fotovoltaica', telefone: '(41) 95555-4444', documento: '321.987.654-03', email: 'ana@foto.com', cidade: 'Curitiba', distribuidora: 'Copel', consumoMedio: 600, saldoAtual: 100, valorMensal: 300, percentualDesconto: 25, dataInicio: new Date(), dataCadastro: new Date() },
                { nome: 'Ricardo Watts', telefone: '(51) 94444-3333', documento: '159.357.258-07', email: 'ricardo@watts.com', cidade: 'Porto Alegre', distribuidora: 'CEEE', consumoMedio: 400, saldoAtual: 0, valorMensal: 180, percentualDesconto: 20, dataInicio: new Date(), dataCadastro: new Date() }
              ];

              for (const item of testData) {
                const clientId = await ClienteService.create(item);

                for (let i = 0; i < 6; i++) {
                  const date = subMonths(startOfMonth(new Date()), i);
                  const bruto = 200 + (Math.random() * 300);
                  const taxa = 50 + (Math.random() * 50);
                  const desc = item.percentualDesconto;
                  const vDesc = bruto * (1 - (desc / 100));
                  const vLiq = vDesc - taxa;

                  await FinanceiroService.create({
                    clienteId: clientId as number,
                    referenciaMes: format(date, "MMMM'/'yyyy", { locale: ptBR }),
                    consumoKw: 100 + (Math.random() * 400),
                    valorTotalBruto: bruto,
                    valorTaxaUso: taxa,
                    percentualDescontoAplicado: desc,
                    valorComDesconto: vDesc,
                    valorLiquido: vLiq,
                    valor: vDesc,
                    data: date,
                    status: i > 0 ? 'pago' : 'pendente',
                    metodo: 'Pix'
                  } as any);
                }
              }
              alert('Dados de Clientes e Financeiro gerados com sucesso!');
              loadClientes();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Gerar Dados de Teste
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/clientes/novo')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdAdd size={20} /> Novo Cliente
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          backgroundColor: 'var(--surface-color)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--border-color)',
          flex: 1,
          minWidth: '300px'
        }}>
          <MdSearch size={24} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="skeleton-row" borderRadius={8} />)}
        </div>
      ) : clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('nome')}>
                    Nome <MdSort size={16} />
                  </th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('cidade')}>
                    Cidade <MdSort size={16} />
                  </th>
                  <th style={{ padding: '1rem' }}>Distribuidora</th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('consumoMedio')}>
                    Consumo <MdSort size={16} />
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClientes.map(cliente => (
                  <tr key={cliente.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{cliente.nome}</td>
                    <td style={{ padding: '1rem' }}>{cliente.cidade}</td>
                    <td style={{ padding: '1rem' }}>{cliente.distribuidora}</td>
                    <td style={{ padding: '1rem' }}>{cliente.consumoMedio} kWh</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--solar-yellow)', cursor: 'pointer', marginRight: '10px', fontWeight: 'bold' }}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--solar-orange)', cursor: 'pointer', marginRight: '10px' }}
                        title="Editar"
                      >
                        <MdEdit size={20} />
                      </button>
                      <button
                        onClick={() => cliente.id && handleDelete(cliente.id)}
                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                        title="Excluir"
                      >
                        <MdDelete size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 1rem'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Mostrando {paginatedClientes.length} de {filteredAndSortedClientes.length} clientes
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ padding: '0.5rem' }}
              >
                <MdChevronLeft size={20} />
              </button>
              <span>Página {currentPage} de {totalPages || 1}</span>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ padding: '0.5rem' }}
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Clientes;
