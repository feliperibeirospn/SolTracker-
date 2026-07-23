import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente } from '@/services/db';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdChevronLeft, MdChevronRight, MdSort, MdStar, MdStarBorder } from 'react-icons/md';
import { subMonths, startOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Skeleton from '@/components/Skeleton';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Cliente>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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
      toast.error('Erro ao carregar clientes');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleToggleFavorito = async (id: number) => {
    try {
      await ClienteService.toggleFavorito(id);
      loadClientes();
    } catch (error) {
      toast.error('Erro ao atualizar favorito');
    }
  };

  const openDeleteDialog = (id: number) => {
    setClientToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      try {
        await ClienteService.delete(clientToDelete);
        toast.success('Cliente removido');
        loadClientes();
      } catch (error) {
        toast.error('Falha ao remover');
      } finally {
        setIsDeleteDialogOpen(false);
        setClientToDelete(null);
      }
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

  const filteredAndSortedClientes = useMemo(() => {
    return clientes
      .filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.documento.includes(searchTerm) ||
          c.cidade.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFavorite = showOnlyFavorites ? c.isFavorito : true;
        return matchesSearch && matchesFavorite;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clientes, searchTerm, sortField, sortDirection, showOnlyFavorites]);

  const totalPages = Math.ceil(filteredAndSortedClientes.length / itemsPerPage);
  const paginatedClientes = filteredAndSortedClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ textAlign: 'left' }}>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Excluir Cliente?"
        message="Esta ação é permanente."
        confirmText="Excluir"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Clientes</h1>
          <p>Gerenciamento de contratos.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const promise = (async () => {
                const testData: any[] = [
                  { nome: 'João Solar', telefone: '(11) 98888-7777', documento: '123.456.789-01', email: 'joao@solar.com', cidade: 'São Paulo', distribuidora: 'Enel', consumoMedio: 350, saldoAtual: 0, valorMensal: 150, percentualDesconto: 20, dataInicio: new Date(), dataCadastro: new Date(), isFavorito: true },
                  { nome: 'Maria Painel', telefone: '(21) 97777-6666', documento: '987.654.321-09', email: 'maria@paineis.com', cidade: 'Rio de Janeiro', distribuidora: 'Light', consumoMedio: 450, saldoAtual: 50, valorMensal: 200, percentualDesconto: 15, dataInicio: new Date(), dataCadastro: new Date() },
                  { nome: 'Ricardo Watts', telefone: '(51) 94444-3333', documento: '159.357.258-07', email: 'ricardo@watts.com', cidade: 'Porto Alegre', distribuidora: 'CEEE', consumoMedio: 400, saldoAtual: 0, valorMensal: 180, percentualDesconto: 20, dataInicio: new Date(), dataCadastro: new Date() }
                ];
                for (const item of testData) {
                  const clientId = await ClienteService.create(item);
                  for (let i = 0; i < 6; i++) {
                    const date = subMonths(startOfMonth(new Date()), i);
                    await FinanceiroService.create({
                      clienteId: clientId as number,
                      referenciaMes: format(date, "MMMM'/'yyyy", { locale: ptBR }),
                      consumoKw: 100 + (Math.random() * 400),
                      valorTotalBruto: 300,
                      valorTaxaUso: 50,
                      percentualDescontoAplicado: 20,
                      valorComDesconto: 240,
                      valorLiquido: 190,
                      valor: 240,
                      data: date,
                      status: i > 0 ? 'pago' : 'pendente',
                    } as any);
                  }
                }
                loadClientes();
              })();
              toast.promise(promise, { loading: 'Gerando...', success: 'Pronto!', error: 'Erro' });
            }}
          >
            Gerar Dados
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/clientes/novo')}><MdAdd size={20} /> Novo</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{
          backgroundColor: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-color)', flex: 1
        }}>
          <MdSearch size={24} color="var(--text-secondary)" />
          <input
            type="text" placeholder="Buscar..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
          />
        </div>

        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', borderRadius: '12px',
            border: '1px solid var(--border-color)', backgroundColor: showOnlyFavorites ? 'var(--solar-orange)' : 'var(--surface-color)',
            color: showOnlyFavorites ? 'white' : 'var(--text-primary)', cursor: 'pointer'
          }}
        >
          {showOnlyFavorites ? <MdStar size={20} /> : <MdStarBorder size={20} />}
          <span>Favoritos</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} className="skeleton-row" borderRadius={8} />)}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', width: '40px' }}></th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('nome')}>Nome <MdSort size={14} /></th>
                  <th className="desktop-only" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('cidade')}>Cidade <MdSort size={14} /></th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('consumoMedio')}>Consumo <MdSort size={14} /></th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClientes.map(cliente => (
                  <tr key={cliente.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => cliente.id && handleToggleFavorito(cliente.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cliente.isFavorito ? 'var(--solar-yellow)' : 'var(--text-secondary)' }}>
                        {cliente.isFavorito ? <MdStar size={20} /> : <MdStarBorder size={20} />}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{cliente.nome}</div>
                      <div className="desktop-only" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{cliente.documento}</div>
                    </td>
                    <td className="desktop-only" style={{ padding: '1rem' }}>{cliente.cidade}</td>
                    <td style={{ padding: '1rem' }}>{cliente.consumoMedio} kWh</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                        <button onClick={() => navigate(`/clientes/${cliente.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><MdSearch /></button>
                        <button onClick={() => navigate(`/clientes/editar/${cliente.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--solar-orange)' }}><MdEdit /></button>
                        <button onClick={() => cliente.id && openDeleteDialog(cliente.id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: '#dc3545' }}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filteredAndSortedClientes.length} total</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><MdChevronLeft /></button>
              <span style={{ fontSize: '0.9rem' }}>{currentPage} / {totalPages || 1}</span>
              <button className="btn btn-secondary" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}><MdChevronRight /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Clientes;
