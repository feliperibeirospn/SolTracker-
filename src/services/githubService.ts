import { CryptoService } from './cryptoService';
import { db } from './db';

export const GitHubService = {
  async saveToGitHub(token: string, repo: string, path: string, password: string) {
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

      // 1. Get the current file SHA if it exists (to update)
      let sha = '';
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          headers: { 'Authorization': `token ${token}` }
        });
        if (res.ok) {
          const fileData = await res.json();
          sha = fileData.sha;
        }
      } catch (e) { /* File might not exist yet */ }

      // 2. Upload/Update file
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `SolTracker Backup ${new Date().toISOString()}`,
          content: btoa(encryptedData), // GitHub requires base64
          sha: sha || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao salvar no GitHub');
      }

      return true;
    } catch (error) {
      console.error('GitHub Save failed:', error);
      throw error;
    }
  },

  async getFromGitHub(token: string, repo: string, path: string, password: string) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
      });

      if (!res.ok) throw new Error('Backup não encontrado no GitHub');

      const fileData = await res.json();
      const encryptedData = atob(fileData.content);
      const decryptedString = CryptoService.decrypt(encryptedData, password);

      if (!decryptedString) throw new Error('Senha incorreta ou dados corrompidos');

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
      console.error('GitHub Restore failed:', error);
      throw error;
    }
  }
};
