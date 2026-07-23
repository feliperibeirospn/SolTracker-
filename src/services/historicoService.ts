import { db, type Historico } from './db';
import { SyncService } from './syncService';

export const HistoricoService = {
  async create(historico: Historico) {
    const id = await db.historicos.add(historico);
    SyncService.triggerAutoSync(); // Auto-sync
    return id;
  },

  async getAll() {
    return await db.historicos.orderBy('data').reverse().toArray();
  },

  async getById(id: number) {
    return await db.historicos.get(id);
  },

  async update(id: number, changes: Partial<Historico>) {
    const result = await db.historicos.update(id, changes);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  },

  async delete(id: number) {
    const result = await db.historicos.delete(id);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  },

  async clearAll() {
    const result = await db.historicos.clear();
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  }
};
