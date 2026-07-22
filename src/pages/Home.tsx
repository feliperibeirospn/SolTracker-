import React, { useEffect, useState } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { MdPeople, MdAttachMoney, MdErrorOutline, MdAccountBalance } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalClientes: number;
  receitaTotal: number;
  totalPendentes: number;
  totalAtrasados: number;
  saldoTotal: number;
  activeClients: number;
  defaulterClients: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    receitaTotal: 0,
    totalPendentes: 0,
    totalAtrasados: 0,
    saldoTotal: 0,
    activeClients: 0,
    defaulterClients: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientes = await ClienteService.getAll();
      const pagamentos = await FinanceiroService.getAll();

      // Basic Stats
      const statsUpdate: DashboardStats = {
        totalClientes: clientes.length,
        receitaTotal: pagamentos
          .filter(p => p.status === 'pago')
          .reduce((acc, p) => acc + p.valor, 0),
        totalPendentes: pagamentos
          .filter(p => p.status === 'pendente')
          .reduce((acc, p) => acc + p.valor, 0),
        totalAtrasados: pagamentos
          .filter(p => p.status === 'atrasado')
          .reduce((acc, p) => acc + p.valor, 0),
        saldoTotal: clientes.reduce((acc, c) => acc + (c.saldoAtual || 0), 0),
        activeClients: clientes.length, // Placeholder logic
        defaulterClients: pagamentos.some(p => p.status === 'atrasado') ? 1 : 0, // Placeholder logic
      };

      // Calculate logic for active vs defaulters
      const clientWithAtraso = new Set(pagamentos.filter(p => p.status === 'atrasado').map(p => p.clienteId));
      statsUpdate.defaulterClients = clientWithAtraso.size;
      statsUpdate.activeClients = clientes.length - clientWithAtraso.size;

      setStats(statsUpdate);

      // Prepare Chart Data (Last 6 months receipts)
      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(startOfMonth(new Date()), i);
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          rawDate: date,
          valor: 0
        };
      }).reverse();

      pagamentos.forEach(p => {
        if (p.status === 'pago') {
          const monthIndex = last6Months.findIndex(m => isSameMonth(m.rawDate, p.data));
          if (monthIndex !== -1) {
            last6Months[monthIndex].valor += p.valor;
          }
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

  const Card = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'var(--surface-color)',
      borderRadius: '8px',
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{title}</h3>
        <div style={{ color: color }}>{icon}</div>
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{value}</p>
    </div>
  );

  if (loading) return <p>Carregando dashboard...</p>;

  return (
    <div style={{ textAlign: 'left' }}>
      <h1>Dashboard Solar</h1>
      <p style={{ marginBottom: '2rem' }}>Resumo financeiro e operacional do sistema.</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card
          title="Clientes"
          value={stats.totalClientes}
          icon={<MdPeople size={24} />}
          color="var(--solar-yellow)"
        />
        <Card
          title="Receita"
          value={`R$ ${stats.receitaTotal.toFixed(2)}`}
          icon={<MdAttachMoney size={24} />}
          color="#28a745"
        />
        <Card
          title="Atrasados"
          value={`R$ ${stats.totalAtrasados.toFixed(2)}`}
          icon={<MdErrorOutline size={24} />}
          color="#dc3545"
        />
        <Card
          title="Saldo Total"
          value={`R$ ${stats.saldoTotal.toFixed(2)}`}
          icon={<MdAccountBalance size={24} />}
          color="var(--solar-orange)"
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        {/* Receipts Chart */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Recebimentos Mensais (R$)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--solar-orange)' }}
                />
                <Bar dataKey="valor" fill="var(--solar-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clients Status Chart */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Status dos Clientes</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Energy Balance (Bottom Full Width) */}
      <div style={{
        marginTop: '1.5rem',
        backgroundColor: 'var(--surface-color)',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Resumo de Saldo de Energia por Cliente</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Destaque para o saldo financeiro acumulado que reflete a economia de energia.</p>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-secondary)" />
              <YAxis type="category" dataKey="month" stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
              />
              <Bar dataKey="valor" fill="var(--solar-yellow)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Home;
