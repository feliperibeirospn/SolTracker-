import { db } from './db';
import { CryptoService } from './cryptoService';

export const BackupService = {
  // Task 10.1: Export and Encrypt Data
  async exportBackup(password: string) {
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

      const blob = new Blob([encryptedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `soltracker_backup_${new Date().toISOString().split('T')[0]}.sol`;
      link.click();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  },

  // Task 10.2: Decrypt and Import Data
  async importBackup(encryptedData: string, password: string) {
    try {
      const decryptedString = CryptoService.decrypt(encryptedData, password);
      if (!decryptedString) throw new Error('Senha incorreta ou arquivo corrompido');

      const data = JSON.parse(decryptedString);

      // Simple validation
      if (!data.clientes || !data.pagamentos) throw new Error('Formato de backup inválido');

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
      console.error('Import failed:', error);
      throw error;
    }
  }
};
