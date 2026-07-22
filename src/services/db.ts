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
  percentualDesconto: number; // Novo: Ex: 20 para 20%
  dataInicio: Date;
  observacoes?: string;
  dataCadastro: Date;
}

export interface Pagamento {
  id?: number;
  clienteId: number;
  data: Date;
  status: 'pendente' | 'pago' | 'atrasado';

  // Novos campos da regra de negócio
  consumoKw: number;
  valorTotalBruto: number; // Valor da conta sem desconto
  valorTaxaUso: number; // Taxa da concessionária (Cosern, etc)
  percentualDescontoAplicado: number;
  valorComDesconto: number; // (Total Bruto - Desconto%)
  valorLiquido: number; // Lucro = (Total Bruto - Desconto%) - Taxa Uso

  valor: number; // Valor que o cliente deve pagar (mesmo que valorComDesconto)
  metodo?: string;
  referenciaMes?: string; // Ex: "07/2026"
}

export interface Historico {
  id?: number;
  tipo: 'sistema' | 'usuario' | 'alerta';
  data: Date;
  descricao: string;
  usuarioId?: string;
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

    this.version(4).stores({
      clientes: '++id, nome, email, documento, cidade',
      pagamentos: '++id, clienteId, data, status, referenciaMes',
      historicos: '++id, tipo, data',
      configuracoes: 'chave'
    });
  }
}

export const db = new SolarTrackerDB();
