import React, { useEffect, useState } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import { MdPeople, MdAttachMoney, MdErrorOutline, MdAccountBalance, MdPictureAsPdf, MdTableChart } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

interface DashboardStats {
  totalClientes: number;
  receitaTotal: number;
  totalAtrasados: number;
  saldoTotal: number;
  activeClients: number;
  defaulterClients: number;
  lucroAcumulado: number;
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

      const statsUpdate: DashboardStats = {
        totalClientes: c.length,
        receitaTotal: p
          .filter(f => f.status === 'pago')
          .reduce((acc, f) => acc + (f.valor || 0), 0),
        totalAtrasados: p
          .filter(f => f.status === 'atrasado')
          .reduce((acc, f) => acc + (f.valor || 0), 0),
        saldoTotal: c.reduce((acc, curr) => acc + (curr.saldoAtual || 0), 0),
        activeClients: 0,
        defaulterClients: 0,
        lucroAcumulado: p
          .filter(f => f.status === 'pago')
          .reduce((acc, f) => acc + (f.valorLiquido || 0), 0),
      };

      const clientWithAtraso = new Set(p.filter(f => f.status === 'atrasado').map(f => f.clienteId));
      statsUpdate.defaulterClients = clientWithAtraso.size;
      statsUpdate.activeClients = c.length - clientWithAtraso.size;

      setStats(statsUpdate);

      // CORREÇÃO DA LÓGICA DO GRÁFICO
      // Criamos os últimos 6 meses a partir de agora
      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(startOfMonth(new Date()), i);
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          rawDate: date,
          receita: 0,
          lucro: 0
        };
      }).reverse();

      // Mapeamos TODAS as faturas (não apenas as pagas, para refletir o histórico real se desejar,
      // ou mantemos apenas pagas para "Receita Realizada")
      p.forEach(f => {
        // Usamos a data de vencimento da fatura para encaixar no mês do gráfico
        const fDate = new Date(f.data);

        const monthIndex = last6Months.findIndex(m => isSameMonth(m.rawDate, fDate));

        if (monthIndex !== -1) {
          // Se quiser mostrar apenas o que FOI PAGO:
          if (f.status === 'pago') {
            last6Months[monthIndex].receita += (f.valorComDesconto || f.valor || 0);
            last6Months[monthIndex].lucro += (f.valorLiquido || 0);
          }
          // Nota: Se quiser mostrar a receita PREVISTA vs REALIZADA, a lógica mudaria.
          // Aqui mantemos Receita Bruta (Faturada) vs Lucro Real (Líquido)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Dashboard Solar</h1>
          <p>Resumo financeiro e lucro real do sistema.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportToPDF(faturas, clientes)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdPictureAsPdf size={20} /> Exportar PDF
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => exportToExcel(faturas, clientes)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdTableChart size={20} /> Exportar Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card
          title="Clientes"
          value={stats.totalClientes}
          icon={<MdPeople size={24} />}
          color="var(--solar-yellow)"
        />
        <Card
          title="Receita Total"
          value={`R$ ${stats.receitaTotal.toFixed(2)}`}
          icon={<MdAttachMoney size={24} />}
          color="#28a745"
        />
        <Card
          title="Lucro Líquido"
          value={`R$ ${stats.lucroAcumulado.toFixed(2)}`}
          icon={<MdAccountBalance size={24} />}
          color="var(--solar-orange)"
        />
        <Card
          title="Saldo em Clientes"
          value={`R$ ${stats.saldoTotal.toFixed(2)}`}
          icon={<MdErrorOutline size={24} />}
          color="#fdb813"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Receita vs Lucro Líquido (R$)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2)}`, name]}
                />
                <Legend />
                <Bar name="Receita Bruta" dataKey="receita" fill="var(--solar-yellow)" radius={[4, 4, 0, 0]} />
                <Bar name="Lucro Líquido" dataKey="lucro" fill="var(--solar-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Status da Carteira</h3>
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
    </div>
  );
};

export default Home;
