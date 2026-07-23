import React, { useEffect, useState } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import {
  MdPeople, MdAttachMoney, MdTrendingUp, MdTrendingDown,
  MdElectricBolt, MdSecurity, MdPictureAsPdf, MdTableChart
} from 'react-icons/md';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalClientes: number;
  receitaTotal: number;
  totalAtrasados: number;
  saldoTotal: number;
  activeClients: number;
  defaulterClients: number;
  lucroAcumulado: number;
  crescimentoMensal: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    receitaTotal: 0,
    totalAtrasados: 0,
    saldoTotal: 0,
    activeClients: 0,
    defaulterClients: 0,
    lucroAcumulado: 0,
    crescimentoMensal: 0,
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturas, setFaturas] = useState<Pagamento[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const c = await ClienteService.getAll();
      const p = await FinanceiroService.getAll();
      setClientes(c);
      setFaturas(p);

      const pagas = p.filter(f => f.status === 'pago');
      const totalPagas = pagas.reduce((acc, f) => acc + (f.valor || 0), 0);
      const totalLucro = pagas.reduce((acc, f) => acc + (f.valorLiquido || 0), 0);

      const currentMonth = new Date();
      const prevMonth = subMonths(currentMonth, 1);
      const receitaAtual = pagas.filter(f => isSameMonth(new Date(f.data), currentMonth)).reduce((acc, f) => acc + (f.valor || 0), 0);
      const receitaAnterior = pagas.filter(f => isSameMonth(new Date(f.data), prevMonth)).reduce((acc, f) => acc + (f.valor || 0), 0);
      const crescimento = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : 0;

      const clientWithAtraso = new Set(p.filter(f => f.status === 'atrasado').map(f => f.clienteId));

      setStats({
        totalClientes: c.length,
        receitaTotal: totalPagas,
        totalAtrasados: p.filter(f => f.status === 'atrasado').reduce((acc, f) => acc + (f.valor || 0), 0),
        saldoTotal: c.reduce((acc, curr) => acc + (curr.saldoAtual || 0), 0),
        activeClients: c.length - clientWithAtraso.size,
        defaulterClients: clientWithAtraso.size,
        lucroAcumulado: totalLucro,
        crescimentoMensal: crescimento
      });

      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(startOfMonth(new Date()), i);
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          rawDate: date,
          receita: 0,
          lucro: 0
        };
      }).reverse();

      p.forEach(f => {
        const fDate = new Date(f.data);
        const monthIndex = last6Months.findIndex(m => isSameMonth(m.rawDate, fDate));
        if (monthIndex !== -1 && f.status === 'pago') {
          last6Months[monthIndex].receita += (f.valorComDesconto || f.valor || 0);
          last6Months[monthIndex].lucro += (f.valorLiquido || 0);
        }
      });

      setChartData(last6Months);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: 'Ativos', value: stats.activeClients, color: '#28a745' },
    { name: 'Inadimplentes', value: stats.defaulterClients, color: '#dc3545' },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  const ModernCard = ({ title, value, icon, color, trend }: { title: string; value: string | number; icon: React.ReactNode; color: string; trend?: number }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{
        padding: '1.5rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        opacity: 0.1,
        color: color,
        transform: 'scale(3)'
      }}>
        {icon}
      </div>

      <div style={{ zIndex: 1 }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>{value}</p>

        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '0.5rem', fontSize: '0.8rem', color: trend >= 0 ? '#28a745' : '#dc3545' }}>
            {trend >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
            <span>{Math.abs(trend).toFixed(1)}% este mês</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) return <p>Carregando dashboard moderno...</p>;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ textAlign: 'left' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Painel Executivo</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visão estratégica do SolTracker em tempo real.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => exportToPDF(faturas, clientes)} style={{ borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdPictureAsPdf size={20} /> <span className="desktop-only">PDF</span>
          </button>
          <button className="btn btn-secondary" onClick={() => exportToExcel(faturas, clientes)} style={{ borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdTableChart size={20} /> <span className="desktop-only">Excel</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <ModernCard
          title="Faturamento"
          value={`R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<MdAttachMoney />}
          color="#28a745"
          trend={stats.crescimentoMensal}
        />
        <ModernCard
          title="Lucro Real"
          value={`R$ ${stats.lucroAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<MdTrendingUp />}
          color="var(--solar-orange)"
        />
        <ModernCard
          title="Carteira"
          value={stats.totalClientes}
          icon={<MdPeople />}
          color="var(--solar-yellow)"
        />
        <ModernCard
          title="Consumo Geral"
          value={`${faturas.reduce((acc, f) => acc + (f.consumoKw || 0), 0).toFixed(0)} kW`}
          icon={<MdElectricBolt />}
          color="#007bff"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

        <motion.div variants={itemVariants} style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Desempenho Financeiro</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px 12px', backgroundColor: 'var(--bg-color)', borderRadius: '20px' }}>Últimos 6 meses</span>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--solar-yellow)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--solar-yellow)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--solar-orange)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--solar-orange)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip
                  cursor={{ stroke: 'var(--solar-yellow)', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                />
                <Area name="Receita" type="monotone" dataKey="receita" stroke="var(--solar-yellow)" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                <Area name="Lucro Líquido" type="monotone" dataKey="lucro" stroke="var(--solar-orange)" fillOpacity={1} fill="url(#colorLucro)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <motion.div variants={itemVariants} style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', flex: 1 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Saúde da Carteira</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '60%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {statusData.map(s => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color }}></div>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} style={{
            backgroundColor: 'var(--sidebar-bg)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)'
          }}>
            <div style={{ backgroundColor: 'rgba(253, 184, 19, 0.1)', padding: '1rem', borderRadius: '16px' }}>
              <MdSecurity size={32} color="var(--solar-yellow)" />
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--solar-yellow)' }}>Proteção de Dados</h4>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Sincronização automática com AES-256 ativa.</p>
            </div>
          </motion.div>
        </div>

      </div>

      <motion.div variants={itemVariants} style={{ marginTop: '2rem', backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Pendências Financeiras Críticas</h3>
        {faturas.filter(f => f.status === 'atrasado').length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>🎉 Tudo em dia! Nenhuma fatura atrasada.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {faturas.filter(f => f.status === 'atrasado').slice(0, 4).map(f => (
              <div key={f.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', borderLeft: '4px solid #dc3545' }}>
                <small style={{ color: 'var(--text-secondary)' }}>{clientes.find(c => c.id === f.clienteId)?.nome}</small>
                <div style={{ fontWeight: 'bold' }}>R$ {f.valor.toFixed(2)}</div>
                <small style={{ color: '#dc3545' }}>Vencido em {format(new Date(f.data), 'dd/MM')}</small>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Home;
