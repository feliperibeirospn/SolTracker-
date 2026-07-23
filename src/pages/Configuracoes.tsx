import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BackupService } from '@/services/backupService';
import { CloudBackupService } from '@/services/cloudBackupService';
import { GitHubService } from '@/services/githubService';
import { useSync } from '@/hooks/useSync';
import {
  MdBackup, MdCloudDownload, MdCloudUpload, MdWarning,
  MdCloudDone, MdDeleteForever, MdWifi, MdWifiOff
} from 'react-icons/md';
import { FaGithub } from 'react-icons/fa';
import '@/styles/forms.css';

const Configuracoes: React.FC = () => {
  const { userEmail } = useAuth();
  const { isOnline } = useSync();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  // GitHub Config State
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('gh_repo') || '');
  const [ghPath] = useState(() => localStorage.getItem('gh_path') || 'backup.enc');

  useEffect(() => {
    localStorage.setItem('gh_token', ghToken);
    localStorage.setItem('gh_repo', ghRepo);
  }, [ghToken, ghRepo]);

  const handleExport = async () => {
    if (!password) { alert('Informe sua senha mestre.'); return; }
    setLoading(true);
    try {
      await BackupService.exportBackup(password);
      alert('Backup local gerado!');
    } catch (error) { alert('Erro no backup local.'); }
    finally { setLoading(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !password) return;
    if (!window.confirm('Substituir dados atuais?')) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await BackupService.importBackup(evt.target?.result as string, password);
        window.location.reload();
      } catch (err) { alert('Senha incorreta.'); }
    };
    reader.readAsText(file);
    setLoading(false);
  };

  const handleCloudSave = async () => {
    if (!password || !userEmail) return;
    setLoading(true);
    try {
      await CloudBackupService.saveToCloud(userEmail, password);
      alert('Salvo na Nuvem!');
    } catch (error) { alert('Erro ao salvar na nuvem.'); }
    finally { setLoading(false); }
  };

  const handleCloudRestore = async () => {
    if (!password || !userEmail) {
      alert('Sua senha mestre e email são necessários para descriptografar os dados da nuvem.');
      return;
    }
    if (!window.confirm('Deseja baixar e restaurar os dados da nuvem? Isso apagará os dados atuais do navegador.')) return;

    setLoading(true);
    try {
      await CloudBackupService.getFromCloud(userEmail, password);
      alert('Dados da nuvem restaurados com sucesso!');
      window.location.reload();
    } catch (error) {
      alert('Falha ao restaurar da nuvem. Verifique a senha ou se existe um backup salvo para este email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloudDelete = async () => {
    if (!password || !userEmail) return;
    if (!window.confirm('Tem certeza que deseja apagar permanentemente seu backup da nuvem?')) return;

    setLoading(true);
    try {
      await CloudBackupService.deleteFromCloud(userEmail, password);
      alert('Backup removido da nuvem.');
    } catch (error) {
      alert('Erro ao remover backup da nuvem.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSave = async () => {
    if (!password || !ghToken || !ghRepo) {
      alert('Preencha a senha mestre e as configurações do GitHub (Token e Repo).');
      return;
    }
    setLoading(true);
    try {
      await GitHubService.saveToGitHub(ghToken, ghRepo, ghPath, password);
      alert('Backup salvo no GitHub com sucesso!');
    } catch (error: any) {
      alert('Erro GitHub: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Configurações</h1>
          <p>Email vinculado: <strong>{userEmail}</strong></p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: isOnline ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
          color: isOnline ? '#28a745' : '#dc3545',
          fontWeight: 'bold'
        }}>
          {isOnline ? <><MdWifi /> Online</> : <><MdWifiOff /> Offline</>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Backup Local */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}><MdBackup /> Backup Local</h3>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ width: '100%', marginBottom: '0.5rem' }}>
            <MdCloudDownload size={20} style={{marginRight: '8px'}}/> Exportar .sol
          </button>
          <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
            <MdCloudUpload size={20} style={{marginRight: '8px'}}/> Importar .sol
            <input type="file" accept=".sol" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Cloud Backup (Cloudflare) */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}><MdCloudDone /> Cloudflare KV</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleCloudSave} disabled={loading || !isOnline} style={{ width: '100%', backgroundColor: 'var(--solar-yellow)', color: '#000' }}>
              <MdCloudUpload size={18} style={{marginRight: '8px'}}/> Salvar na Nuvem
            </button>
            <button className="btn btn-secondary" onClick={handleCloudRestore} disabled={loading || !isOnline} style={{ width: '100%' }}>
              <MdCloudDownload size={18} style={{marginRight: '8px'}}/> Sincronizar da Nuvem
            </button>
            <button className="btn btn-secondary" onClick={handleCloudDelete} disabled={loading || !isOnline} style={{ width: '100%', color: '#dc3545', borderColor: '#dc3545' }}>
              <MdDeleteForever size={18} style={{marginRight: '8px'}}/> Apagar Nuvem
            </button>
          </div>
        </div>

        {/* GitHub Integration */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}><FaGithub /> GitHub (Privado)</h3>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Token</label>
            <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_xxx..." style={{fontSize: '0.8rem'}} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Repo</label>
            <input type="text" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="user/repo" style={{fontSize: '0.8rem'}} />
          </div>
          <button className="btn btn-primary" onClick={handleGitHubSave} disabled={loading || !isOnline} style={{ width: '100%', backgroundColor: '#24292e' }}>
            Enviar backup.enc
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Senha Mestre de Segurança</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Confirme sua senha para agir" />
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(220, 53, 69, 0.05)',
          borderRadius: '8px',
          border: '1px solid #dc3545',
          display: 'flex',
          gap: '12px'
        }}>
          <MdWarning color="#dc3545" size={24} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc3545' }}>
            <strong>Cuidado:</strong> Ações de restauração substituem todos os dados locais. Sempre verifique sua senha mestre.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
