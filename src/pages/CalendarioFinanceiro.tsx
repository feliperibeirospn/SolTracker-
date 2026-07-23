import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar.css';
import { FinanceiroService } from '@/services/financeiroService';
import { ClienteService } from '@/services/clienteService';
import { type Pagamento, type Cliente } from '@/services/db';
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdCalendarMonth, MdPayments } from 'react-icons/md';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const pagamentoSchema = z.object({
  dataPagamento: z.string().min(1, 'Data de pagamento obrigatória'),
  metodo: z.string().min(1, 'Forma de pagamento obrigatória'),
  observacao: z.string().optional(),
});

type PagamentoFormData = z.infer<typeof pagamentoSchema>;

const CalendarioFinanceiro: React.FC = () => {
  const [faturas, setFaturas] = useState<Pagamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [faturasDoDia, setFaturasDoDia] = useState<Pagamento[]>([]);
  const [receivingPayment, setReceivingPayment] = useState<Pagamento | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      dataPagamento: new Date().toISOString().split('T')[0],
      metodo: 'Pix',
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [p, c] = await Promise.all([
      FinanceiroService.getAll(),
      ClienteService.getAll()
    ]);
    setFaturas(p);
    setClientes(c);
    setLoading(false);
  };

  const handleDateClick = (date: Date) => {
    const found = faturas.filter(f => isSameDay(new Date(f.data), date));
    if (found.length > 0) {
      setFaturasDoDia(found);
      setSelectedDate(date);
    }
  };

  const onConfirmPayment = async (data: PagamentoFormData) => {
    if (!receivingPayment?.id) return;
    try {
      await FinanceiroService.update(receivingPayment.id, {
        status: 'pago',
        data: new Date(data.dataPagamento),
        metodo: data.metodo,
      } as any);
      toast.success('Pagamento registrado com sucesso!');
      setReceivingPayment(null);
      setSelectedDate(null); // Fecha o calendário também para atualizar visão
      reset();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar pagamento.');
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const faturasDia = faturas.filter(f => isSameDay(new Date(f.data), date));
    if (faturasDia.length === 0) return null;

    return (
      <div className="calendar-day-dot-container">
        {faturasDia.slice(0, 3).map((f, i) => (
          <div key={i} className={`calendar-day-dot dot-${f.status}`} />
        ))}
        <div className="desktop-preview">{faturasDia.length} conta{faturasDia.length > 1 ? 's' : ''}</div>
      </div>
    );
  };

  if (loading) return <p>Carregando calendário funcional...</p>;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Calendário Financeiro</h1>
        <p>Gerencie recebimentos diretamente pelo calendário.</p>
      </div>

      <div style={{ position: 'relative' }}>
        <Calendar
          locale="pt-BR"
          onClickDay={handleDateClick}
          tileContent={tileContent}
          className="solar-calendar"
        />

        {/* Modal 1: Detalhes do Dia */}
        <AnimatePresence>
          {selectedDate && !receivingPayment && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 3000, padding: '1rem'
            }} onClick={() => setSelectedDate(null)}>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  backgroundColor: 'var(--surface-color)',
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--solar-orange)' }}>
                    <MdCalendarMonth size={28} />
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</h2>
                  </div>
                  <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <MdClose size={24} />
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                  {faturasDoDia.map(f => {
                    const cliente = clientes.find(c => c.id === f.clienteId);
                    return (
                      <div key={f.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1.25rem', backgroundColor: 'var(--bg-color)',
                        borderRadius: '16px', borderLeft: `5px solid ${f.status === 'pago' ? '#28a745' : f.status === 'atrasado' ? '#dc3545' : '#fdb813'}`
                      }}>
                        <div>
                          <strong style={{ display: 'block' }}>{cliente?.nome || 'Excluído'}</strong>
                          <small style={{ color: 'var(--text-secondary)' }}>R$ {f.valor.toFixed(2)}</small>
                        </div>

                        {f.status !== 'pago' ? (
                          <button
                            onClick={() => setReceivingPayment(f)}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            <MdPayments /> Receber
                          </button>
                        ) : (
                          <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '0.8rem' }}>PAGO</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 2: Formulário de Recebimento */}
        <AnimatePresence>
          {receivingPayment && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 4000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '24px', maxWidth: '450px', width: '100%', border: '1px solid var(--border-color)' }}
              >
                <h2 style={{ color: 'var(--solar-orange)', marginBottom: '1rem' }}>Confirmar Recebimento</h2>
                <p style={{ marginBottom: '1.5rem' }}>Recebendo de <strong>{clientes.find(c => c.id === receivingPayment.clienteId)?.nome}</strong> no valor de <strong>R$ {receivingPayment.valor.toFixed(2)}</strong></p>

                <form onSubmit={handleSubmit(onConfirmPayment)}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Data do Recebimento</label>
                    <input {...register('dataPagamento')} type="date" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Forma de Pagamento</label>
                    <select {...register('metodo')}>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReceivingPayment(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>Confirmar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarioFinanceiro;
