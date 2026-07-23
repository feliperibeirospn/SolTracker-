import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { HistoricoService } from '@/services/historicoService';
import { type Cliente, type Pagamento, type Historico } from '@/services/db';
import { MdEdit, MdArrowBack, MdAccountBalanceWallet, MdHistory, MdReceiptLong, MdPerson, MdContentCopy, MdOpenInNew } from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const DetalhesCliente: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(Number(id));
    }
  }, [id]);

  const loadData = async (clienteId: number) => {
    try {
      let c = await ClienteService.getById(clienteId);
      if (!c) {
        alert('Cliente não encontrado');
        navigate('/clientes');
        return;
      }

      // GARANTIA: Se o cliente não tem hash, gera e salva agora
      if (!c.publicHash) {
        const hash = nanoid(12);
        await ClienteService.update(clienteId, { publicHash: hash });
        c = { ...c, publicHash: hash };
      }

      setCliente(c);

      const p = await FinanceiroService.getByClienteId(clienteId);
      setPagamentos(p.sort((a, b) => b.data.getTime() - a.data.getTime()));

      const h = await HistoricoService.getAll();
      setHistoricos(h.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPortalUrl = () => {
    if (!cliente?.publicHash) return '';
    // Formato compatível com GitHub Pages (HashRouter)
    return `${window.location.origin}${window.location.pathname.split('/clientes')[0]}/#/p/${cliente.publicHash}`;
  };

  const copyPortalLink = () => {
    const url = getPortalUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Link do portal copiado!');
  };

  if (loading) return <p>Carregando detalhes...</p>;
  if (!cliente) return null;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/clientes')}
            style={{ display: 'flex', alignItems: 'center', padding: '0.5rem' }}
          >
            <MdArrowBack size={20} />
          </button>
          <h1>{cliente.nome}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={copyPortalLink}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdContentCopy size={20} /> Copiar Link Portal
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdEdit size={20} /> Editar
          </button>
        </div>
      </div>

      {/* Banner de Atalho do Portal */}
      <div style={{
        backgroundColor: 'var(--sidebar-bg)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--solar-yellow)', fontSize: '1rem' }}>Portal do Cliente Ativo</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>O cliente pode acessar os dados dele através do link seguro.</p>
        </div>
        <button
          onClick={() => window.open(getPortalUrl(), '_blank')}
          style={{ background: 'none', border: '1px solid var(--solar-yellow)', color: 'var(--solar-yellow)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <MdOpenInNew /> Abrir Portal
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <section style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--solar-orange)' }}>
            <MdPerson size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Dados do Cliente</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p><strong>CPF:</strong> {cliente.documento}</p>
            <p><strong>Email:</strong> {cliente.email}</p>
            <p><strong>Telefone:</strong> {cliente.telefone}</p>
            <p><strong>Cidade:</strong> {cliente.cidade}</p>
            <p><strong>Distribuidora:</strong> {cliente.distribuidora}</p>
            <p><strong>Desconto:</strong> {cliente.percentualDesconto}%</p>
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--solar-orange)' }}>
            <MdAccountBalanceWallet size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Financeiro e Consumo</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p><strong>Consumo Médio:</strong> {cliente.consumoMedio} kWh</p>
            <p><strong>Valor Mensal:</strong> R$ {cliente.valorMensal.toFixed(2)}</p>
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '6px',
              backgroundColor: cliente.saldoAtual >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
              border: `1px solid ${cliente.saldoAtual >= 0 ? '#28a745' : '#dc3545'}`
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Saldo Atual</p>
              <p style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: cliente.saldoAtual >= 0 ? '#28a745' : '#dc3545'
              }}>
                R$ {cliente.saldoAtual.toFixed(2)}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <section style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--solar-orange)' }}>
            <MdReceiptLong size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Últimos Pagamentos</h2>
          </div>
          {pagamentos.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum pagamento registrado.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pagamentos.slice(0, 5).map(p => (
                <li key={p.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>R$ {p.valor.toFixed(2)}</span>
                    <br />
                    <small style={{ color: 'var(--text-secondary)' }}>{format(p.data, 'dd/MM/yyyy')}</small>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: p.status === 'pago' ? '#28a745' : p.status === 'pendente' ? '#fdb813' : '#dc3545',
                    color: 'white',
                    height: 'fit-content'
                  }}>
                    {p.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--solar-orange)' }}>
            <MdHistory size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Histórico do Cliente</h2>
          </div>
          {historicos.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Sem registros no histórico.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {historicos.map(h => (
                <li key={h.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <small style={{ color: 'var(--solar-yellow)' }}>{format(h.data, 'dd/MM/yyyy HH:mm')}</small>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{h.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default DetalhesCliente;
