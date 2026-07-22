import React, { useEffect, useState, useMemo } from 'react';
import { HistoricoService } from '@/services/historicoService';
import { type Historico } from '@/services/db';
import { MdHistory, MdEvent, MdArrowDownward, MdNotificationsActive, MdPerson, MdSettings } from 'react-icons/md';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricoPage: React.FC = () => {
  const [logs, setLogs] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await HistoricoService.getAll();
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Group logs by month
  const logsByMonth = useMemo(() => {
    const groups: { [key: string]: Historico[] } = {};

    logs.forEach(log => {
      const monthKey = format(log.data, "MMMM 'de' yyyy", { locale: ptBR });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(log);
    });

    return groups;
  }, [logs]);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return <MdNotificationsActive color="#dc3545" size={20} />;
      case 'usuario': return <MdPerson color="var(--solar-orange)" size={20} />;
      case 'sistema': return <MdSettings color="var(--solar-yellow)" size={20} />;
      default: return <MdEvent color="var(--text-secondary)" size={20} />;
    }
  };

  if (loading) return <p>Carregando linha do tempo...</p>;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Linha do Tempo</h1>
        <p>Histórico completo de atividades e eventos do SolTracker.</p>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
          <MdHistory size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '20px' }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute',
            left: '30px',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: 'var(--border-color)',
            zIndex: 0
          }}></div>

          {Object.entries(logsByMonth).map(([month, monthLogs]) => (
            <div key={month} style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
              {/* Month Header */}
              <div style={{
                display: 'inline-block',
                backgroundColor: 'var(--solar-orange)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textTransform: 'capitalize',
                marginLeft: '-10px'
              }}>
                {month}
              </div>

              {/* Logs for this month */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {monthLogs.map((log, index) => (
                  <div key={log.id || index} style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start'
                  }}>
                    {/* Circle on line */}
                    <div style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-color)',
                      border: '3px solid var(--solar-yellow)',
                      marginTop: '10px',
                      zIndex: 2
                    }}></div>

                    {/* Content Card */}
                    <div style={{
                      flex: 1,
                      backgroundColor: 'var(--surface-color)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getIcon(log.tipo)}
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {log.tipo}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {format(log.data, "dd/MM 'às' HH:mm")}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {log.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* End of line indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem',
            color: 'var(--text-secondary)',
            marginLeft: '-20px'
          }}>
            <MdArrowDownward size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoPage;
