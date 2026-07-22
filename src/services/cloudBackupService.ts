import { CryptoService } from './cryptoService';
import { db } from './db';

const WORKER_URL = 'https://soltracker-api.seu-subdominio.workers.dev';

export const CloudBackupService = {
  // Gera um ID único e seguro baseado em Email + Senha
  generateCloudId(email: string, password: string) {
    return CryptoService.hashPassword(email.toLowerCase() + password);
  },

  async saveToCloud(email: string, password: string) {
    try {
      const data = {
        clientes: await db.clientes.toArray(),
        pagamentos: await db.pagamentos.toArray(),
        historicos: await db.historicos.toArray(),
        configuracoes: await db.configuracoes.toArray(),
        version: db.verno,
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(data);
      const encryptedData = CryptoService.encrypt(jsonString, password);
      const userId = this.generateCloudId(email, password);

      const response = await fetch(`${WORKER_URL}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: encryptedData })
      });

      if (!response.ok) throw new Error('Falha ao enviar para nuvem');
      return true;
    } catch (error) {
      console.error('Cloud Save failed:', error);
      throw error;
    }
  },

  async getFromCloud(email: string, password: string) {
    try {
      const userId = this.generateCloudId(email, password);
      const response = await fetch(`${WORKER_URL}/backup?userId=${userId}`);

      if (!response.ok) throw new Error('Backup não encontrado na nuvem');

      const result = await response.json();
      const decryptedString = CryptoService.decrypt(result.data, password);

      if (!decryptedString) throw new Error('Senha incorreta para descriptografar nuvem');

      const data = JSON.parse(decryptedString);

      await db.transaction('rw', db.clientes, db.pagamentos, db.historicos, db.configuracoes, async () => {
        await db.clientes.clear();
        await db.pagamentos.clear();
        await db.historicos.clear();
        await db.configuracoes.clear();

        await db.clientes.bulkAdd(data.clientes);
        await db.pagamentos.bulkAdd(data.pagamentos);
        await db.historicos.bulkAdd(data.historicos);
        await db.configuracoes.bulkAdd(data.configuracoes);
      });

      return true;
    } catch (error) {
      console.error('Cloud Restore failed:', error);
      throw error;
    }
  },

  async deleteFromCloud(email: string, password: string) {
    try {
      const userId = this.generateCloudId(email, password);
      const response = await fetch(`${WORKER_URL}/backup`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Falha ao deletar da nuvem');
      return true;
    } catch (error) {
      console.error('Cloud Delete failed:', error);
      throw error;
    }
  }
};
