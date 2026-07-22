import { db, type Pagamento } from './db';

export const FinanceiroService = {
  async create(pagamento: Pagamento) {
    return await db.pagamentos.add(pagamento);
  },

  async getAll() {
    return await db.pagamentos.toArray();
  },

  async getById(id: number) {
    return await db.pagamentos.get(id);
  },

  async getByClienteId(clienteId: number) {
    return await db.pagamentos.where('clienteId').equals(clienteId).toArray();
  },

  async update(id: number, changes: Partial<Pagamento>) {
    return await db.pagamentos.update(id, changes);
  },

  async delete(id: number) {
    return await db.pagamentos.delete(id);
  }
};
