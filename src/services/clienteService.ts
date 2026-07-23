import { db, type Cliente } from './db';
import { SyncService } from './syncService';

export const ClienteService = {
  async create(cliente: Cliente) {
    const id = await db.clientes.add(cliente);
    SyncService.triggerAutoSync();
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
    SyncService.triggerAutoSync();
    return result;
  },

  async delete(id: number) {
    const result = await db.clientes.delete(id);
    SyncService.triggerAutoSync();
    return result;
  },

  // Task 13: Favoritos
  async toggleFavorito(id: number) {
    const cliente = await this.getById(id);
    if (!cliente) return;
    const result = await db.clientes.update(id, { isFavorito: !cliente.isFavorito });
    SyncService.triggerAutoSync();
    return result;
  }
};
