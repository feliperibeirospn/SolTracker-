import Dexie, { type Table } from 'dexie';

export interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  documento: string; // CPF
  email: string;
  cidade: string;
  distribuidora: string;
  consumoMedio: number;
  saldoAtual: number;
  valorMensal: number;
  percentualDesconto: number;
  dataInicio: Date;
  observacoes?: string;
  dataCadastro: Date;
  isFavorito?: boolean;
  publicHash?: string; // Novo: Link único para o portal do cliente
}

export interface Pagamento {
  id?: number;
  clienteId: number;
  data: Date;
  status: 'pendente' | 'pago' | 'atrasado';
  consumoKw: number;
  valorTotalBruto: number;
  valorTaxaUso: number;
  percentualDescontoAplicado: number;
  valorComDesconto: number;
  valorLiquido: number;
  valor: number;
  metodo?: string;
  referenciaMes?: string;
}

export interface Historico {
  id?: number;
  tipo: 'sistema' | 'usuario' | 'alerta';
  data: Date;
  descricao: string;
  usuarioId?: string;
  entidade?: string;
  acao?: 'CRIAR' | 'EDITAR' | 'DELETAR' | 'LOGIN' | 'BACKUP';
  detalhes?: string;
}

export interface Configuracao {
  chave: string;
  valor: any;
}

export class SolarTrackerDB extends Dexie {
  clientes!: Table<Cliente>;
  pagamentos!: Table<Pagamento>;
  historicos!: Table<Historico>;
  configuracoes!: Table<Configuracao>;

  constructor() {
    super('solarTracker');

    this.version(7).stores({
      clientes: '++id, nome, email, documento, cidade, isFavorito, publicHash',
      pagamentos: '++id, clienteId, data, status, referenciaMes',
      historicos: '++id, tipo, data, acao, entidade',
      configuracoes: 'chave'
    });
  }
}

export const db = new SolarTrackerDB();
