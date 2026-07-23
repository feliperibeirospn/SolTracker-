import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { CloudBackupService } from '@/services/cloudBackupService';
import { MdWbSunny, MdAccountBalanceWallet, MdTrendingUp, MdQrCodeScanner, MdPictureAsPdf, MdHistory, MdCloudQueue } from 'react-icons/md';
import { format } from 'date-fns';
import Skeleton from '@/components/Skeleton';
import { exportToPDF } from '@/utils/exportUtils';
import { motion } from 'framer-motion';

const PortalCliente: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [cliente, setCliente] = useState<any | null>(null);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'cloud' | null>(null);

  useEffect(() => {
    if (hash) loadData(hash);
  }, [hash]);

  const loadData = async (publicHash: string) => {
    setLoading(true);
    try {
      // 1. TENTA BUSCAR LOCAL (Se o gestor estiver no mesmo navegador)
      const cLocal = await ClienteService.getByHash(publicHash);
      if (cLocal && cLocal.id) {
        setCliente(cLocal);
        const pLocal = await FinanceiroService.getByClienteId(cLocal.id);
        setFaturas(pLocal.sort((a, b) => b.data.getTime() - a.data.getTime()));
        setDataSource('local');
        setLoading(false);
        return;
      }

      // 2. SE NÃO ACHAR LOCAL, BUSCA NA NUVEM (Para o cliente em outro PC)
      const cloudData = await CloudBackupService.getPortalData(publicHash);
      if (cloudData) {
        setCliente({
          nome: cloudData.n,
          saldoAtual: cloudData.s,
          publicHash: cloudData.h
        });
        // Mapeia faturas da nuvem (abreviadas) para o formato da UI
        setFaturas(cloudData.f.map((f: any) => ({
          referenciaMes: f.r,
          valor: f.v,
          data: new Date(f.d),
          status: f.st,
          consumoKw: f.c
        })).sort((a: any, b: any) => b.data.getTime() - a.data.getTime()));

        setDataSource('cloud');
        setLoading(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <div>
        <h1 style={{ color: '#dc3545', fontSize: '2rem', marginBottom: '1rem' }}>Link Expirado ou Inválido</h1>
        <p style={{ color: 'var(--text-secondary)' }}>O portal que você está tentando acessar não foi encontrado ou os dados não foram sincronizados.</p>
        <p style={{ color: 'var(--text-secondary)' }}>Por favor, solicite ao gestor para clicar em "Salvar na Nuvem" no sistema.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <Skeleton height={60} width={250} style={{ marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <Skeleton height={120} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
      </div>
      <Skeleton height={200} borderRadius={24} style={{ marginBottom: '2rem' }} />
    </div>
  );

  if (!cliente) return null;

  const ultimaFatura = faturas.find(f => f.status !== 'pago') || faturas[0];
  const economiaTotal = faturas.filter(f => f.status === 'pago').reduce((acc, f) => acc + (f.valorTotalBruto ? (f.valorTotalBruto - (f.valorComDesconto || f.valor)) : (f.valor * 0.2)), 0);

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'left' }}
      >
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: 'var(--solar-orange)', padding: '10px', borderRadius: '12px', color: 'white' }}>
              <MdWbSunny size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Olá, {cliente.nome}!</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Acompanhe seu desempenho solar em tempo real.</p>
            </div>
          </div>
          {dataSource === 'cloud' && (
            <div title="Dados sincronizados via nuvem" style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem' }}>
              <MdCloudQueue /> ONLINE
            </div>
          )}
        </header>

        {/* Destaques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              <MdAccountBalanceWallet /> SALDO ATUAL
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: cliente.saldoAtual >= 0 ? '#28a745' : '#dc3545' }}>
              R$ {Number(cliente.saldoAtual).toFixed(2)}
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              <MdTrendingUp /> ECONOMIA ESTIMADA
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: 'var(--solar-orange)' }}>
              R$ {economiaTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Fatura em Aberto / PIX */}
        {ultimaFatura && ultimaFatura.status !== 'pago' && (
          <section style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '2rem', borderRadius: '24px', marginBottom: '2rem', position: 'relative', overflow: 'hidden', border: '1px solid #333' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Fatura em Aberto • {ultimaFatura.referenciaMes}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.8rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>R$ {Number(ultimaFatura.valor).toFixed(2)}</p>
                  <p style={{ margin: 0, opacity: 0.8 }}>Vence em {format(new Date(ultimaFatura.data), 'dd/MM/yyyy')}</p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--solar-yellow)', color: 'black', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                  onClick={() => alert('Gerando QR Code PIX...')}
                >
                  <MdQrCodeScanner size={20} /> Pagar com PIX
                </button>
              </div>
            </div>
            <div style={{ position: 'absolute', right: '-30px', top: '-30px', opacity: 0.05 }}>
              <MdWbSunny size={200} />
            </div>
          </section>
        )}

        {/* Histórico de Faturas */}
        <section style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <MdHistory /> Meu Histórico
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {faturas.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', backgroundColor: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem' }}>{f.referenciaMes}</strong>
                  <small style={{ color: 'var(--text-secondary)' }}>{f.consumoKw?.toFixed(0) || '---'} kW compensados</small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>R$ {Number(f.valor).toFixed(2)}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      color: f.status === 'pago' ? '#28a745' : '#dc3545',
                      fontWeight: '800',
                      backgroundColor: f.status === 'pago' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>{f.status.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => exportToPDF([f], [cliente])}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px' }}
                    title="Baixar PDF"
                  >
                    <MdPictureAsPdf size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', paddingBottom: '2rem' }}>
          <p>&copy; {new Date().getFullYear()} SolTracker - Sistema de Monitoramento Solar</p>
          <p style={{ opacity: 0.6 }}>Dados protegidos e sincronizados com a nuvem.</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default PortalCliente;
