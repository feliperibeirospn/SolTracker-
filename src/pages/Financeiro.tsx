import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import { MdAdd, MdCalculate } from 'react-icons/md';

const contaSchema = z.object({
  clienteId: z.number().min(1, 'Selecione um cliente'),
  referenciaMes: z.string().min(1, 'Mês de referência obrigatório'),
  consumoKw: z.number().min(0),
  valorTotalBruto: z.number().min(0, 'Valor bruto obrigatório'),
  valorTaxaUso: z.number().min(0, 'Taxa obrigatória'),
  data: z.string().min(1, 'Data obrigatória'),
});

type ContaFormData = z.infer<typeof contaSchema>;

const Financeiro: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturas, setFaturas] = useState<Pagamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

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
    setClientes(c);
    setFaturas(p.sort((a, b) => b.data.getTime() - a.data.getTime()));
  };

  const onSubmit = async (data: ContaFormData) => {
    if (!selectedCliente) return;

    const percentualDesconto = selectedCliente.percentualDesconto || 0;
    const valorComDesconto = data.valorTotalBruto * (1 - (percentualDesconto / 100));
    const valorLiquido = valorComDesconto - data.valorTaxaUso;

    try {
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
      setShowForm(false);
      reset();
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar fatura.');
    }
  };

  const calcComDesconto = selectedCliente
    ? watchValorTotalBruto * (1 - ((selectedCliente.percentualDesconto || 0) / 100))
    : 0;
  const calcLucro = calcComDesconto - watchValorTaxaUso;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Financeiro</h1>
          <p>Lançamento de faturas e controle de recebimentos.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showForm ? 'Cancelar' : <><MdAdd size={20} /> Nova Fatura</>}
        </button>
      </div>

      {showForm && (
        <div className="form-container" style={{ marginBottom: '2rem', maxWidth: 'none' }}>
          <h2 style={{ color: 'var(--solar-orange)', marginBottom: '1.5rem' }}>Lançar Nova Conta</h2>
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
                <label>Taxa de Uso Concessionária (R$)</label>
                <input {...register('valorTaxaUso', { valueAsNumber: true })} type="number" step="0.01" />
                {errors.valorTaxaUso && <span className="error-message">{errors.valorTaxaUso.message}</span>}
              </div>

              <div className="form-group">
                <label>Data de Vencimento</label>
                <input {...register('data')} type="date" />
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
                    <small>Valor com Desconto ({selectedCliente?.percentualDesconto || 0}%)</small>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--solar-yellow)' }}>
                      R$ {calcComDesconto.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <small>Lucro Real (Líquido)</small>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
                      R$ {calcLucro.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                    <MdCalculate size={20} />
                    <small>Cálculo automático</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                Gerar Fatura
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Mês/Ref</th>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Bruto</th>
              <th style={{ padding: '1rem' }}>Taxa</th>
              <th style={{ padding: '1rem' }}>Líquido (Lucro)</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {faturas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhuma fatura lançada.
                </td>
              </tr>
            ) : (
              faturas.map(f => {
                const cliente = clientes.find(c => c.id === f.clienteId);
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{f.referenciaMes}</td>
                    <td style={{ padding: '1rem' }}>{cliente?.nome || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>R$ {f.valorTotalBruto?.toFixed(2) || '0.00'}</td>
                    <td style={{ padding: '1rem' }}>R$ {f.valorTaxaUso?.toFixed(2) || '0.00'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#28a745' }}>
                      R$ {f.valorLiquido?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        backgroundColor: f.status === 'pago' ? '#28a745' : '#fdb813',
                        color: 'white'
                      }}>
                        {f.status.toUpperCase()}
                      </span>
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
