import { db, type Cliente } from './db';
import { SyncService } from './syncService';
import { AuditService } from './auditService';
import { nanoid } from 'nanoid';

export const ClienteService = {
  async create(cliente: Cliente) {
    // Gera um hash único de 12 caracteres para o portal público
    const publicHash = nanoid(12);
    const id = await db.clientes.add({ ...cliente, publicHash });
    await AuditService.log('usuario', 'CRIAR', 'Cliente', `Cliente "${cliente.nome}" cadastrado.`);
    SyncService.triggerAutoSync();
    return id;
  },

  async getAll() {
    return await db.clientes.toArray();
  },

  async getById(id: number) {
    return await db.clientes.get(id);
  },

  async getByHash(hash: string) {
    return await db.clientes.where('publicHash').equals(hash).first();
  },

  async update(id: number, changes: Partial<Cliente>) {
    const clienteAntigo = await this.getById(id);
    const result = await db.clientes.update(id, changes);
    await AuditService.log('usuario', 'EDITAR', 'Cliente', `Cliente "${clienteAntigo?.nome}" atualizado.`);
    SyncService.triggerAutoSync();
    return result;
  },

  async delete(id: number) {
    const clienteAntigo = await this.getById(id);
    const result = await db.clientes.delete(id);
    await AuditService.log('usuario', 'DELETAR', 'Cliente', `Cliente "${clienteAntigo?.nome}" removido.`);
    SyncService.triggerAutoSync();
    return result;
  },

  async toggleFavorito(id: number) {
    const cliente = await this.getById(id);
    if (!cliente) return;
    const result = await db.clientes.update(id, { isFavorito: !cliente.isFavorito });
    await AuditService.log('usuario', 'EDITAR', 'Cliente', `${cliente.isFavorito ? 'Removeu' : 'Adicionou'} "${cliente.nome}" aos favoritos.`);
    SyncService.triggerAutoSync();
    return result;
  }
};
