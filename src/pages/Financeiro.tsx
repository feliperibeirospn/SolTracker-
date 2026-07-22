import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import {
  MdAdd, MdCalculate, MdCheckCircle, MdError, MdPending,
  MdFilterList, MdPayments, MdEdit, MdDelete
} from 'react-icons/md';
import {
  format, isBefore, startOfDay, isToday, isThisWeek, isThisMonth,
  isThisYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    formState: { errors, isSubmitting },
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
    formState: { errors: errorsPay, isSubmitting: isSubmittingPay },
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      dataPagamento: new Date().toISOString().split('T')[0],
      metodo: 'Pix',
    }
  });

  const watchValorTotalBruto = watch('valorTotalBruto', 0);
  const watchValorTaxaUso = watch('valorTaxaUso', 0);
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
      alert('Pagamento registrado com sucesso!');
      setReceivingPayment(null);
      resetPay();
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pagamento.');
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
        alert('Fatura atualizada com sucesso!');
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
        alert('Fatura gerada com sucesso!');
      }
      handleCancelForm();
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar fatura.');
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
    if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      try {
        await FinanceiroService.delete(id);
        loadData();
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir fatura.');
      }
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

  const calcComDesconto = selectedCliente
    ? watchValorTotalBruto * (1 - ((selectedCliente.percentualDesconto || 0) / 100))
    : 0;
  const calcLucro = calcComDesconto - watchValorTaxaUso;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pago': return { bg: 'rgba(40, 167, 69, 0.1)', color: '#28a745', icon: <MdCheckCircle /> };
      case 'atrasado': return { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', icon: <MdError /> };
      default: return { bg: 'rgba(253, 184, 19, 0.1)', color: '#fdb813', icon: <MdPending /> };
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Financeiro</h1>
          <p>Gestão de faturas, vencimentos e recebimentos.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { if(showForm) handleCancelForm(); else setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showForm ? 'Cancelar' : <><MdAdd size={20} /> Nova Fatura</>}
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: 'var(--surface-color)',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <MdFilterList size={20} />
          <strong>Filtros:</strong>
        </div>

        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value as any)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">Todo período</option>
          <option value="today">Hoje</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mês</option>
          <option value="year">Este Ano</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">Todos os Status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>

        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {filteredFaturas.length} resultados encontrados
        </div>
      </div>

      {showForm && (
        <div className="form-container" style={{ marginBottom: '2rem', maxWidth: 'none' }}>
          <h2 style={{ color: 'var(--solar-orange)', marginBottom: '1.5rem' }}>{editingFatura ? 'Editar Fatura' : 'Gerar Fatura'}</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente</label>
                <select {...register('clienteId', { valueAsNumber: true })}>
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.percentualDesconto}% desc.)</option>
                  ))}
                </select>
                {errors.clienteId && <span className="error-message">{errors.clienteId.message}</span>}
              </div>

              <div className="form-group">
                <label>Mês de Referência</label>
                <input {...register('referenciaMes')} placeholder="Ex: Julho/2026" />
                {errors.referenciaMes && <span className="error-message">{errors.referenciaMes.message}</span>}
              </div>

              <div className="form-group">
                <label>Consumo (kW)</label>
                <input {...register('consumoKw', { valueAsNumber: true })} type="number" step="0.01" />
              </div>

              <div className="form-group">
                <label>Valor Total Bruto (R$)</label>
                <input {...register('valorTotalBruto', { valueAsNumber: true })} type="number" step="0.01" />
                {errors.valorTotalBruto && <span className="error-message">{errors.valorTotalBruto.message}</span>}
              </div>

              <div className="form-group">
                <label>Taxa Concessionária (R$)</label>
                <input {...register('valorTaxaUso', { valueAsNumber: true })} type="number" step="0.01" />
                {errors.valorTaxaUso && <span className="error-message">{errors.valorTaxaUso.message}</span>}
              </div>

              <div className="form-group">
                <label>Vencimento (Dia/Mês/Ano)</label>
                <input
                  {...register('data')}
                  type="date"
                  style={{ display: 'block', width: '100%' }}
                />
                {errors.data && <span className="error-message">{errors.data.message}</span>}
              </div>

              <div className="form-group full-width" style={{
                backgroundColor: 'var(--bg-color)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px dashed var(--solar-orange)',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <small>A pagar pelo cliente ({selectedCliente?.percentualDesconto || 0}%)</small>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--solar-yellow)' }}>
                      R$ {calcComDesconto.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <small>Lucro Real</small>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
                      R$ {calcLucro.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                    <MdCalculate size={20} />
                    <small>Cálculo em tempo real</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>Voltar</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {editingFatura ? 'Salvar Alterações' : 'Lançar Fatura'}
              </button>
            </div>
          </form>
        </div>
      )}

      {receivingPayment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '1rem'
        }}>
          <div className="form-container" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ color: 'var(--solar-orange)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MdPayments /> Receber Pagamento
            </h2>
            <p>Registrando pagamento de <strong>R$ {receivingPayment.valor.toFixed(2)}</strong></p>

            <form onSubmit={handleSubmitPay(onConfirmPayment)}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Data do Recebimento</label>
                <input {...registerPay('dataPagamento')} type="date" />
                {errorsPay.dataPagamento && <span className="error-message">{errorsPay.dataPagamento.message}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Forma de Pagamento</label>
                <select {...registerPay('metodo')}>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão">Cartão</option>
                </select>
                {errorsPay.metodo && <span className="error-message">{errorsPay.metodo.message}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Observação (Opcional)</label>
                <textarea {...registerPay('observacao')} rows={2} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setReceivingPayment(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingPay}>
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Valor (Com Desc.)</th>
              <th style={{ padding: '1rem' }}>Vencimento</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaturas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum registro financeiro encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredFaturas.map(f => {
                const cliente = clientes.find(c => c.id === f.clienteId);
                const statusStyle = getStatusStyle(f.status);
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{cliente?.nome || 'Excluído'}</div>
                      <small style={{ color: 'var(--text-secondary)' }}>{f.referenciaMes}</small>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      R$ {f.valor.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {format(new Date(f.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {statusStyle.icon}
                        {f.status.toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        {f.status !== 'pago' ? (
                          <button
                            onClick={() => setReceivingPayment(f)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <MdPayments /> Receber
                          </button>
                        ) : (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Paga em {format(new Date(f.data), 'dd/MM/yyyy')}
                          </div>
                        )}
                        <button
                          onClick={() => handleEdit(f)}
                          style={{ background: 'none', border: 'none', color: 'var(--solar-orange)', cursor: 'pointer' }}
                          title="Editar Fatura"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => f.id && handleDelete(f.id)}
                          style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                          title="Excluir Fatura"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financeiro;
