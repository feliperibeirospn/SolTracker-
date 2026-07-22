import { db, type Cliente } from './db';

export const ClienteService = {
  async create(cliente: Cliente) {
    return await db.clientes.add(cliente);
  },

  async getAll() {
    return await db.clientes.toArray();
  },

  async getById(id: number) {
    return await db.clientes.get(id);
  },

  async update(id: number, changes: Partial<Cliente>) {
    return await db.clientes.update(id, changes);
  },

  async delete(id: number) {
    return await db.clientes.delete(id);
  }
};
