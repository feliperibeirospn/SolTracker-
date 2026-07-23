import { db, type Pagamento } from './db';
import { SyncService } from './syncService';

export const FinanceiroService = {
  async create(pagamento: Pagamento) {
    const id = await db.pagamentos.add(pagamento);
    SyncService.triggerAutoSync(); // Auto-sync
    return id;
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
    const result = await db.pagamentos.update(id, changes);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  },

  async delete(id: number) {
    const result = await db.pagamentos.delete(id);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  }
};
