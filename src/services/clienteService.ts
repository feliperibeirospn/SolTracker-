import { db, type Cliente } from './db';
import { SyncService } from './syncService';

export const ClienteService = {
  async create(cliente: Cliente) {
    const id = await db.clientes.add(cliente);
    SyncService.triggerAutoSync(); // Auto-sync
    return id;
  },

  async getAll() {
    return await db.clientes.toArray();
  },

  async getById(id: number) {
    return await db.clientes.get(id);
  },

  async update(id: number, changes: Partial<Cliente>) {
    const result = await db.clientes.update(id, changes);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  },

  async delete(id: number) {
    const result = await db.clientes.delete(id);
    SyncService.triggerAutoSync(); // Auto-sync
    return result;
  }
};
