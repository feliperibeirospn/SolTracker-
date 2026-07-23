import React, { useEffect, useState } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import {
  MdPeople, MdAttachMoney, MdTrendingUp, MdTrendingDown,
  MdElectricBolt, MdPictureAsPdf, MdTableChart,
  MdPendingActions, MdMoneyOff, MdPercent, MdAccountBalanceWallet
} from 'react-icons/md';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import { motion } from 'framer-motion';
import Skeleton from '@/components/Skeleton';

interface DashboardStats {
  totalClientes: number;
  receitaPrevista: number;
  receitaRecebida: number;
  receitaEmAberto: number;
  lucroReal: number;
  totalInadimplentes: number;
  taxaInadimplencia: number;
  crescimentoMensal: number;
  consumoGeral: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    receitaPrevista: 0,
    receitaRecebida: 0,
    receitaEmAberto: 0,
    lucroReal: 0,
    totalInadimplentes: 0,
    taxaInadimplencia: 0,
    crescimentoMensal: 0,
    consumoGeral: 0,
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

      const prevista = p.reduce((acc, f) => acc + (f.valor || 0), 0);
      const recebida = p.filter(f => f.status === 'pago').reduce((acc, f) => acc + (f.valor || 0), 0);
      const emAberto = p.filter(f => f.status !== 'pago').reduce((acc, f) => acc + (f.valor || 0), 0);
      const lucro = p.filter(f => f.status === 'pago').reduce((acc, f) => acc + (f.valorLiquido || 0), 0);
      const consumo = p.reduce((acc, f) => acc + (f.consumoKw || 0), 0);

      const inadimplentesIds = new Set(p.filter(f => f.status === 'atrasado').map(f => f.clienteId));
      const totalInadimplentes = inadimplentesIds.size;
      const taxaInadimplencia = c.length > 0 ? (totalInadimplentes / c.length) * 100 : 0;

      const now = new Date();
      const prev = subMonths(now, 1);
      const mAtual = p.filter(f => f.status === 'pago' && isSameMonth(new Date(f.data), now)).reduce((acc, f) => acc + (f.valor || 0), 0);
      const mAnterior = p.filter(f => f.status === 'pago' && isSameMonth(new Date(f.data), prev)).reduce((acc, f) => acc + (f.valor || 0), 0);
      const crescimento = mAnterior > 0 ? ((mAtual - mAnterior) / mAnterior) * 100 : 0;

      setStats({
        totalClientes: c.length,
        receitaPrevista: prevista,
        receitaRecebida: recebida,
        receitaEmAberto: emAberto,
        lucroReal: lucro,
        totalInadimplentes,
        taxaInadimplencia,
        crescimentoMensal: crescimento,
        consumoGeral: consumo
      });

      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(startOfMonth(new Date()), i);
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          rawDate: date,
          prevista: 0,
          recebida: 0,
          lucro: 0
        };
      }).reverse();

      p.forEach(f => {
        const monthIndex = last6Months.findIndex(m => isSameMonth(m.rawDate, new Date(f.data)));
        if (monthIndex !== -1) {
          last6Months[monthIndex].prevista += (f.valor || 0);
          if (f.status === 'pago') {
            last6Months[monthIndex].recebida += (f.valor || 0);
            last6Months[monthIndex].lucro += (f.valorLiquido || 0);
          }
        }
      });

      setChartData(last6Months);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const ModernCard = ({ title, value, icon, color, trend, subValue }: { title: string; value: string; icon: any; color: string; trend?: number; subValue?: string }) => (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        padding: '1.5rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ padding: '10px', backgroundColor: `${color}15`, borderRadius: '12px', color: color }}>
          {React.createElement(icon, { size: 24 })}
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: trend >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
            {trend >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
        <p style={{ margin: '5px 0', fontSize: '1.6rem', fontWeight: '800' }}>{value}</p>
        {subValue && <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{subValue}</small>}
      </div>
    </motion.div>
  );

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton height={400} borderRadius={24} /></div>;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Dashboard Financeiro</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestão executiva e saúde financeira da operação.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => exportToPDF(faturas, clientes)} style={{ borderRadius: '12px' }}><MdPictureAsPdf size={20} /></button>
          <button className="btn btn-secondary" onClick={() => exportToExcel(faturas, clientes)} style={{ borderRadius: '12px' }}><MdTableChart size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <ModernCard
          title="Receita Prevista"
          value={`R$ ${stats.receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={MdAccountBalanceWallet}
          color="var(--solar-yellow)"
          subValue="Total faturado no período"
        />
        <ModernCard
          title="Recebido"
          value={`R$ ${stats.receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={MdAttachMoney}
          color="#28a745"
          trend={stats.crescimentoMensal}
        />
        <ModernCard
          title="Em Aberto"
          value={`R$ ${stats.receitaEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={MdPendingActions}
          color="#fdb813"
          subValue="Aguardando pagamento"
        />
        <ModernCard
          title="Lucro Real"
          value={`R$ ${stats.lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={MdTrendingUp}
          color="var(--solar-orange)"
          subValue="Após descontos e taxas"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <ModernCard
          title="Clientes Ativos"
          value={stats.totalClientes.toString()}
          icon={MdPeople}
          color="#007bff"
        />
        <ModernCard
          title="Inadimplentes"
          value={stats.totalInadimplentes.toString()}
          icon={MdMoneyOff}
          color="#dc3545"
          subValue="Faturas com atraso"
        />
        <ModernCard
          title="Taxa de Inadimplência"
          value={`${stats.taxaInadimplencia.toFixed(1)}%`}
          icon={MdPercent}
          color="#6c757d"
        />
        <ModernCard
          title="Consumo Total"
          value={`${stats.consumoGeral.toFixed(0)} kW`}
          icon={MdElectricBolt}
          color="var(--solar-yellow)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Fluxo de Caixa Mensal (R$)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]}
                />
                <Legend />
                <Bar name="Previsto" dataKey="prevista" fill="#e9ecef" radius={[4, 4, 0, 0]} />
                <Bar name="Recebido" dataKey="recebida" fill="#28a745" radius={[4, 4, 0, 0]} />
                <Bar name="Lucro Real" dataKey="lucro" fill="var(--solar-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Performance de Recebimento</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28a745" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: 'none' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]}
                />
                <Area name="Recebido" type="monotone" dataKey="recebida" stroke="#28a745" fillOpacity={1} fill="url(#colorRec)" strokeWidth={3} />
                <Area name="Previsto" type="monotone" dataKey="prevista" stroke="#6c757d" strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
