import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import {
  MdAdd, MdCheckCircle, MdError, MdPending,
  MdFilterList, MdPayments, MdEdit, MdDelete, MdPictureAsPdf, MdTableChart
} from 'react-icons/md';
import {
  format, isBefore, startOfDay, isToday, isThisWeek, isThisMonth,
  isThisYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

const contaSchema = z.object({
  clienteId: z.number().min(1, 'Selecione um cliente'),
  referenciaMes: z.string().min(1, 'Mês de referência obrigatório'),
  consumoKw: z.number().min(0),
  valorTotalBruto: z.number().min(0, 'Valor bruto obrigatório'),
  valorTaxaUso: z.number().min(0, 'Taxa obrigatória'),
  data: z.string().min(1, 'Data de vencimento obrigatória'),
});

const pagamentoSchema = z.object({
  dataPagamento: z.string().min(1, 'Data de pagamento obrigatória'),
  metodo: z.string().min(1, 'Forma de pagamento obrigatória'),
  observacao: z.string().optional(),
});

type ContaFormData = z.infer<typeof contaSchema>;
type PagamentoFormData = z.infer<typeof pagamentoSchema>;

const Financeiro: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturas, setFaturas] = useState<Pagamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFatura, setEditingFatura] = useState<Pagamento | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente' | 'atrasado'>('all');
  const [receivingPayment, setReceivingPayment] = useState<Pagamento | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      consumoKw: 0,
      valorTotalBruto: 0,
      valorTaxaUso: 0,
      data: new Date().toISOString().split('T')[0],
    }
  });

  const {
    register: registerPay,
    handleSubmit: handleSubmitPay,
    reset: resetPay,
    formState: { isSubmitting: isSubmittingPay },
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      dataPagamento: new Date().toISOString().split('T')[0],
      metodo: 'Pix',
    }
  });

  const watchClienteId = watch('clienteId');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (watchClienteId) {
      const cliente = clientes.find(c => c.id === Number(watchClienteId));
      setSelectedCliente(cliente || null);
    }
  }, [watchClienteId, clientes]);

  const loadData = async () => {
    const [c, p] = await Promise.all([
      ClienteService.getAll(),
      FinanceiroService.getAll()
    ]);

    const today = startOfDay(new Date());
    const updatedFaturas = p.map(f => {
      if (f.status === 'pendente' && isBefore(startOfDay(new Date(f.data)), today)) {
        return { ...f, status: 'atrasado' as const };
      }
      return f;
    });

    setClientes(c);
    setFaturas(updatedFaturas.sort((a, b) => b.data.getTime() - a.data.getTime()));
  };

  const onConfirmPayment = async (data: PagamentoFormData) => {
    if (!receivingPayment?.id) return;
    try {
      await FinanceiroService.update(receivingPayment.id, {
        status: 'pago',
        data: new Date(data.dataPagamento),
        metodo: data.metodo,
      } as any);
      setReceivingPayment(null);
      resetPay();
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data: ContaFormData) => {
    if (!selectedCliente) return;
    const percentualDesconto = selectedCliente.percentualDesconto || 0;
    const valorComDesconto = data.valorTotalBruto * (1 - (percentualDesconto / 100));
    const valorLiquido = valorComDesconto - data.valorTaxaUso;

    try {
      if (editingFatura?.id) {
        await FinanceiroService.update(editingFatura.id, {
          ...data,
          data: new Date(data.data),
          clienteId: Number(data.clienteId),
          percentualDescontoAplicado: percentualDesconto,
          valorComDesconto,
          valorLiquido,
          valor: valorComDesconto,
        } as any);
      } else {
        await FinanceiroService.create({
          ...data,
          data: new Date(data.data),
          clienteId: Number(data.clienteId),
          percentualDescontoAplicado: percentualDesconto,
          valorComDesconto,
          valorLiquido,
          valor: valorComDesconto,
          status: 'pendente'
        } as any);
      }
      handleCancelForm();
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (fatura: Pagamento) => {
    setEditingFatura(fatura);
    setShowForm(true);
    reset({
      clienteId: fatura.clienteId,
      referenciaMes: fatura.referenciaMes,
      consumoKw: fatura.consumoKw,
      valorTotalBruto: fatura.valorTotalBruto,
      valorTaxaUso: fatura.valorTaxaUso,
      data: new Date(fatura.data).toISOString().split('T')[0],
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir fatura?')) {
      await FinanceiroService.delete(id);
      loadData();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingFatura(null);
    reset();
  };

  const filteredFaturas = useMemo(() => {
    return faturas.filter(f => {
      const fDate = new Date(f.data);
      let matchesPeriod = true;
      if (filterPeriod === 'today') matchesPeriod = isToday(fDate);
      else if (filterPeriod === 'week') matchesPeriod = isThisWeek(fDate);
      else if (filterPeriod === 'month') matchesPeriod = isThisMonth(fDate);
      else if (filterPeriod === 'year') matchesPeriod = isThisYear(fDate);
      const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
      return matchesPeriod && matchesStatus;
    });
  }, [faturas, filterPeriod, filterStatus]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pago': return { bg: 'rgba(40, 167, 69, 0.1)', color: '#28a745', icon: <MdCheckCircle /> };
      case 'atrasado': return { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', icon: <MdError /> };
      default: return { bg: 'rgba(253, 184, 19, 0.1)', color: '#fdb813', icon: <MdPending /> };
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Financeiro</h1>
          <p>Faturas e recebimentos.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => exportToPDF(filteredFaturas, clientes)}><MdPictureAsPdf /></button>
          <button className="btn btn-secondary" onClick={() => exportToExcel(filteredFaturas, clientes)}><MdTableChart /></button>
          <button className="btn btn-primary" onClick={() => { if(showForm) handleCancelForm(); else setShowForm(true); }}>
            {showForm ? 'Cancelar' : <><MdAdd /> Nova</>}
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem',
        backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '12px',
        border: '1px solid var(--border-color)', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <MdFilterList size={20} />
          <strong className="desktop-only">Filtros:</strong>
        </div>

        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', flex: 1 }}>
          <option value="all">Todo período</option>
          <option value="today">Hoje</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
          <option value="year">Ano</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', flex: 1 }}>
          <option value="all">Status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      {showForm && (
        <div className="form-container" style={{ marginBottom: '2rem', maxWidth: 'none' }}>
          <h2>{editingFatura ? 'Editar Fatura' : 'Lançar Fatura'}</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente</label>
                <select {...register('clienteId', { valueAsNumber: true })}>
                  <option value="">Selecionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Mês</label><input {...register('referenciaMes')} placeholder="MM/AAAA" /></div>
              <div className="form-group"><label>Valor Bruto</label><input {...register('valorTotalBruto', { valueAsNumber: true })} type="number" step="0.01" /></div>
              <div className="form-group"><label>Taxa</label><input {...register('valorTaxaUso', { valueAsNumber: true })} type="number" step="0.01" /></div>
              <div className="form-group"><label>Vencimento</label><input {...register('data')} type="date" /></div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>Voltar</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {receivingPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="form-container" style={{ width: '100%', maxWidth: '400px' }}>
            <h2>Receber Pagamento</h2>
            <form onSubmit={handleSubmitPay(onConfirmPayment)}>
              <div className="form-group"><label>Data</label><input {...registerPay('dataPagamento')} type="date" /></div>
              <div className="form-group"><label>Meio</label><select {...registerPay('metodo')}><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option></select></div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setReceivingPayment(null)}>Sair</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingPay}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Valor</th>
              <th className="desktop-only" style={{ padding: '1rem' }}>Vencimento</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaturas.map(f => {
              const cliente = clientes.find(c => c.id === f.clienteId);
              const statusStyle = getStatusStyle(f.status);
              return (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{cliente?.nome || '...'}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{f.referenciaMes}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>R$ {f.valor.toFixed(2)}</td>
                  <td className="desktop-only" style={{ padding: '1rem' }}>{format(new Date(f.data), 'dd/MM/yy', { locale: ptBR })}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                      {f.status.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                      {f.status !== 'pago' && <button onClick={() => setReceivingPayment(f)} className="btn btn-primary" style={{ padding: '0.4rem' }}><MdPayments /></button>}
                      <button onClick={() => handleEdit(f)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><MdEdit /></button>
                      <button onClick={() => f.id && handleDelete(f.id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: '#dc3545' }}><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financeiro;
