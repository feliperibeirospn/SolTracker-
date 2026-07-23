import { useAuth } from '@/hooks/useAuth';
import { CloudBackupService } from './cloudBackupService';

export const SyncService = {
  async triggerAutoSync() {
    const { isAuthenticated, userEmail, sessionPassword } = useAuth.getState();

    // Só tenta sincronizar se estiver logado e tiver a senha na memória
    if (isAuthenticated && userEmail && sessionPassword && navigator.onLine) {
      console.log('🔄 Iniciando sincronização automática...');
      try {
        await CloudBackupService.saveToCloud(userEmail, sessionPassword);
        console.log('✅ Sincronização concluída.');
      } catch (error) {
        console.error('❌ Falha na sincronização automática:', error);
      }
    }
  }
};
