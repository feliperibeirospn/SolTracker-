import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ClienteService } from '@/services/clienteService';
import '@/styles/forms.css';

const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  documento: z.string().min(11, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  distribuidora: z.string().min(2, 'Distribuidora obrigatória'),
  consumoMedio: z.number().min(0, 'Deve ser maior ou igual a 0'),
  saldoAtual: z.number(),
  valorMensal: z.number().min(0, 'Deve ser maior ou igual a 0'),
  percentualDesconto: z.number().min(0).max(100, 'Percentual deve ser entre 0 e 100'),
  dataInicio: z.string().min(1, 'Data de início obrigatória'),
  observacoes: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const EditarCliente: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema)
  });

  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      try {
        const cliente = await ClienteService.getById(Number(id));
        if (cliente) {
          reset({
            ...cliente,
            dataInicio: new Date(cliente.dataInicio).toISOString().split('T')[0]
          });
        } else {
          alert('Cliente não encontrado');
          navigate('/clientes');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [id, reset, navigate]);

  const onSubmit = async (data: ClienteFormData) => {
    if (!id) return;
    try {
      await ClienteService.update(Number(id), {
        ...data,
        dataInicio: new Date(data.dataInicio),
      } as any);
      alert('Cliente atualizado com sucesso!');
      navigate('/clientes');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar cliente.');
    }
  };

  if (loading) return <p>Carregando dados do cliente...</p>;

  return (
    <div className="form-container">
      <h1 style={{ color: 'var(--solar-orange)' }}>Editar Cliente</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          <div className="form-group">
            <label>Nome Completo</label>
            <input {...register('nome')} placeholder="Ex: João Silva" />
            {errors.nome && <span className="error-message">{errors.nome.message}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input {...register('email')} type="email" placeholder="email@exemplo.com" />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input {...register('telefone')} placeholder="(00) 00000-0000" />
            {errors.telefone && <span className="error-message">{errors.telefone.message}</span>}
          </div>

          <div className="form-group">
            <label>CPF</label>
            <input {...register('documento')} placeholder="000.000.000-00" />
            {errors.documento && <span className="error-message">{errors.documento.message}</span>}
          </div>

          <div className="form-group">
            <label>Cidade</label>
            <input {...register('cidade')} placeholder="Ex: São Paulo" />
            {errors.cidade && <span className="error-message">{errors.cidade.message}</span>}
          </div>

          <div className="form-group">
            <label>Distribuidora</label>
            <input {...register('distribuidora')} placeholder="Ex: Enel, CPFL" />
            {errors.distribuidora && <span className="error-message">{errors.distribuidora.message}</span>}
          </div>

          <div className="form-group">
            <label>Consumo Médio (kWh)</label>
            <input {...register('consumoMedio', { valueAsNumber: true })} type="number" step="0.01" />
            {errors.consumoMedio && <span className="error-message">{errors.consumoMedio.message}</span>}
          </div>

          <div className="form-group">
            <label>Desconto (%)</label>
            <input {...register('percentualDesconto', { valueAsNumber: true })} type="number" />
            {errors.percentualDesconto && <span className="error-message">{errors.percentualDesconto.message}</span>}
          </div>

          <div className="form-group">
            <label>Valor Mensal (R$)</label>
            <input {...register('valorMensal', { valueAsNumber: true })} type="number" step="0.01" />
            {errors.valorMensal && <span className="error-message">{errors.valorMensal.message}</span>}
          </div>

          <div className="form-group">
            <label>Data de Início</label>
            <input {...register('dataInicio')} type="date" />
            {errors.dataInicio && <span className="error-message">{errors.dataInicio.message}</span>}
          </div>

          <div className="form-group full-width">
            <label>Observações</label>
            <textarea {...register('observacoes')} rows={3} placeholder="Notas adicionais..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/clientes')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarCliente;
