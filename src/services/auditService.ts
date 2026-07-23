import { HistoricoService } from './historicoService';

export const AuditService = {
  async log(
    tipo: 'sistema' | 'usuario' | 'alerta',
    acao: 'CRIAR' | 'EDITAR' | 'DELETAR' | 'LOGIN' | 'BACKUP',
    entidade: string,
    descricao: string,
    detalhes?: any
  ) {
    try {
      await HistoricoService.create({
        tipo,
        acao,
        entidade,
        descricao,
        data: new Date(),
        detalhes: detalhes ? JSON.stringify(detalhes) : undefined
      });
    } catch (error) {
      console.error('Falha ao registrar auditoria:', error);
    }
  }
};
