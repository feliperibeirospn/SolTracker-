import { db, type Historico } from './db';

export const HistoricoService = {
  async create(historico: Historico) {
    return await db.historicos.add(historico);
  },

  async getAll() {
    return await db.historicos.orderBy('data').reverse().toArray();
  },

  async getById(id: number) {
    return await db.historicos.get(id);
  },

  async update(id: number, changes: Partial<Historico>) {
    return await db.historicos.update(id, changes);
  },

  async delete(id: number) {
    return await db.historicos.delete(id);
  },

  async clearAll() {
    return await db.historicos.clear();
  }
};
