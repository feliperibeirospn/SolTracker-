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
  dataInicio: Date;
  observacoes?: string;
  dataCadastro: Date;
}

export interface Pagamento {
  id?: number;
  clienteId: number;
  valor: number;
  data: Date;
  status: 'pendente' | 'pago' | 'atrasado';
  metodo?: string;
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

    // Atualizado para versão 2 para incluir novos campos no esquema se necessário
    // Embora o Dexie permita campos dinâmicos, é boa prática versionar
    this.version(2).stores({
      clientes: '++id, nome, email, documento, cidade',
      pagamentos: '++id, clienteId, data, status',
      historicos: '++id, tipo, data',
      configuracoes: 'chave'
    });
  }
}

export const db = new SolarTrackerDB();
