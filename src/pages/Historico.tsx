import React, { useEffect, useState, useMemo } from 'react';
import { HistoricoService } from '@/services/historicoService';
import { type Historico } from '@/services/db';
import {
  MdHistory, MdArrowDownward, MdNotificationsActive, MdPerson, MdSettings,
  MdAddCircle, MdEdit, MdDelete, MdLogin, MdCloudUpload
} from 'react-icons/md';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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

  const logsByMonth = useMemo(() => {
    const groups: { [key: string]: Historico[] } = {};
    logs.forEach(log => {
      const monthKey = format(log.data, "MMMM 'de' yyyy", { locale: ptBR });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(log);
    });
    return groups;
  }, [logs]);

  const getActionIcon = (log: Historico) => {
    if (log.acao === 'CRIAR') return <MdAddCircle color="#28a745" size={18} />;
    if (log.acao === 'EDITAR') return <MdEdit color="var(--solar-yellow)" size={18} />;
    if (log.acao === 'DELETAR') return <MdDelete color="#dc3545" size={18} />;
    if (log.acao === 'LOGIN') return <MdLogin color="#007bff" size={18} />;
    if (log.acao === 'BACKUP') return <MdCloudUpload color="var(--solar-orange)" size={18} />;

    switch (log.tipo) {
      case 'alerta': return <MdNotificationsActive color="#dc3545" size={18} />;
      case 'usuario': return <MdPerson color="var(--solar-orange)" size={18} />;
      case 'sistema': return <MdSettings color="var(--solar-yellow)" size={18} />;
      default: return <MdHistory size={18} />;
    }
  };

  if (loading) return <p>Carregando auditoria...</p>;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Auditoria e Logs</h1>
        <p>Acompanhe todas as alterações e acessos realizados no sistema.</p>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
          <MdHistory size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum log de auditoria encontrado.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '20px' }}>
          <div style={{
            position: 'absolute', left: '30px', top: '0', bottom: '0',
            width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0
          }}></div>

          <AnimatePresence>
            {Object.entries(logsByMonth).map(([month, monthLogs]) => (
              <motion.div
                key={month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}
              >
                <div style={{
                  display: 'inline-block', backgroundColor: 'var(--sidebar-bg)',
                  color: 'var(--solar-yellow)', padding: '0.4rem 1.2rem',
                  borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem',
                  marginBottom: '1.5rem', border: '1px solid var(--border-color)',
                  textTransform: 'capitalize', marginLeft: '-10px'
                }}>
                  {month}
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {monthLogs.map((log, index) => (
                    <motion.div
                      key={log.id || index}
                      whileHover={{ x: 5 }}
                      style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}
                    >
                      <div style={{
                        minWidth: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: 'var(--bg-color)', border: '3px solid var(--solar-orange)',
                        marginTop: '10px', zIndex: 2
                      }}></div>

                      <div style={{
                        flex: 1, backgroundColor: 'var(--surface-color)', padding: '1rem',
                        borderRadius: '12px', border: '1px solid var(--border-color)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                            {getActionIcon(log)}
                            <strong style={{ fontSize: '0.9rem' }}>{log.descricao}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {log.entidade && <span style={{ color: 'var(--solar-orange)', marginRight: '8px' }}>#{log.entidade}</span>}
                            <span>{format(log.data, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px',
                          borderRadius: '4px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)'
                        }}>
                          {log.acao || 'INFO'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', color: 'var(--text-secondary)', marginLeft: '-20px' }}>
            <MdArrowDownward size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoPage;
