import Dexie, { type Table } from 'dexie';

export interface Cliente {
  id?: number;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
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

    this.version(1).stores({
      clientes: '++id, nome, email, documento',
      pagamentos: '++id, clienteId, data, status',
      historicos: '++id, tipo, data',
      configuracoes: 'chave'
    });
  }
}

export const db = new SolarTrackerDB();
