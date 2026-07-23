import { CryptoService } from './cryptoService';
import { db } from './db';

const WORKER_URL = 'https://soltracker.felipecleones999.workers.dev';

export const CloudBackupService = {
  generateCloudId(email: string, password: string) {
    return CryptoService.hashPassword(email.toLowerCase() + password);
  },

  async saveToCloud(email: string, password: string) {
    try {
      const clientes = await db.clientes.toArray();
      const pagamentos = await db.pagamentos.toArray();

      // 1. Dados Privados (Criptografados com AES-256)
      const fullData = {
        clientes,
        pagamentos,
        historicos: await db.historicos.toArray(),
        configuracoes: await db.configuracoes.toArray(),
        version: db.verno,
        exportedAt: new Date().toISOString()
      };
      const encryptedData = CryptoService.encrypt(JSON.stringify(fullData), password);
      const userId = this.generateCloudId(email, password);

      // 2. Dados Públicos do Portal (Apenas o essencial, sem dados sensíveis)
      // Isso permite que o link funcione em qualquer navegador sem login
      const portalData = clientes.map(c => ({
        h: c.publicHash,
        n: c.nome.split(' ')[0], // Apenas primeiro nome por privacidade
        s: c.saldoAtual,
        f: pagamentos.filter(p => p.clienteId === c.id).map(p => ({
          r: p.referenciaMes,
          v: p.valor,
          d: p.data,
          st: p.status,
          c: p.consumoKw
        }))
      }));

      // Envia ambos para a Worker
      const response = await fetch(`${WORKER_URL}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          data: encryptedData,
          portalData: JSON.stringify(portalData) // Salvo separadamente para o portal
        })
      });

      if (!response.ok) throw new Error('Falha ao enviar para nuvem');
      return true;
    } catch (error) {
      console.error('Cloud Save failed:', error);
      throw error;
    }
  },

  // Busca dados específicos para um portal (Público)
  async getPortalData(hash: string) {
    try {
      const response = await fetch(`${WORKER_URL}/portal?hash=${hash}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Fetch Portal Data failed:', error);
      return null;
    }
  },

  async getFromCloud(email: string, password: string) {
    try {
      const userId = this.generateCloudId(email, password);
      const response = await fetch(`${WORKER_URL}/backup?userId=${userId}`);
      if (!response.ok) throw new Error('Backup não encontrado');

      const result = await response.json();
      const decryptedString = CryptoService.decrypt(result.data, password);
      if (!decryptedString) throw new Error('Senha incorreta');

      const data = JSON.parse(decryptedString);
      await db.transaction('rw', db.clientes, db.pagamentos, db.historicos, db.configuracoes, async () => {
        await db.clientes.clear(); await db.pagamentos.clear();
        await db.historicos.clear(); await db.configuracoes.clear();
        await db.clientes.bulkAdd(data.clientes);
        await db.pagamentos.bulkAdd(data.pagamentos);
        await db.historicos.bulkAdd(data.historicos);
        await db.configuracoes.bulkAdd(data.configuracoes);
      });
      return true;
    } catch (error) { throw error; }
  },

  async deleteFromCloud(email: string, password: string) {
    try {
      const userId = this.generateCloudId(email, password);
      await fetch(`${WORKER_URL}/backup`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return true;
    } catch (error) { throw error; }
  }
};
