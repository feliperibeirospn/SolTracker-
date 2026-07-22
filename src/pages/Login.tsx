import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MdLock, MdVpnKey, MdWbSunny, MdEmail, MdPersonAdd, MdCloudDownload } from 'react-icons/md';
import '@/styles/forms.css';

const Login: React.FC = () => {
  const { masterHash, userEmail: storedEmail, setMasterPassword, login } = useAuth();

  // States
  const [view, setView] = useState<'selection' | 'create' | 'login'>(masterHash ? 'login' : 'selection');
  const [email, setEmail] = useState(storedEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido.');
      return;
    }

    if (view === 'create') {
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      setMasterPassword(email, password);
    } else {
      const success = login(email, password);
      if (!success) {
        setError('Email ou Senha incorretos.');
      }
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      padding: '1rem'
    }}>
      <div className="form-container" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ color: 'var(--solar-orange)', marginBottom: '1.5rem' }}>
          <MdWbSunny size={64} />
          <h1 style={{ margin: '0.5rem 0', color: 'var(--text-primary)' }}>SolTracker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sistema de Gestão Solar</p>
        </div>

        {/* 1. SELECTION VIEW: Novo Usuário ou Login */}
        {view === 'selection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Como deseja começar?</p>

            <button
              className="btn btn-primary"
              onClick={() => setView('create')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem' }}
            >
              <MdPersonAdd size={24} />
              <div style={{ textAlign: 'left' }}>
                <strong>Criar Novo Acesso Local</strong>
                <br /><small style={{ fontSize: '0.7rem', opacity: 0.9 }}>Vou começar um banco de dados do zero.</small>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setView('login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem' }}
            >
              <MdCloudDownload size={24} />
              <div style={{ textAlign: 'left' }}>
                <strong>Já possuo um acesso</strong>
                <br /><small style={{ fontSize: '0.7rem' }}>Vou entrar ou restaurar um backup.</small>
              </div>
            </button>
          </div>
        )}

        {/* 2. CREATE / LOGIN FORM VIEW */}
        {(view === 'create' || view === 'login') && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              {view === 'create' ? 'Configurar Credenciais' : 'Entrar no Sistema'}
            </h2>

            <div className="form-group">
              <div style={{ position: 'relative' }}>
                <MdEmail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ position: 'relative' }}>
                <MdLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder={view === 'create' ? "Crie sua senha mestre" : "Sua senha mestre"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            {view === 'create' && (
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <MdVpnKey style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '40px', width: '100%' }}
                    required
                  />
                </div>
              </div>
            )}

            {error && <p style={{ color: '#dc3545', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {view === 'create' ? 'Finalizar e Entrar' : 'Acessar'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setView('selection')}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              Voltar
            </button>
          </form>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {view === 'create'
            ? 'Seus dados serão criptografados com esta senha.'
            : 'Sua privacidade é nossa prioridade.'}
        </p>
      </div>
    </div>
  );
};

export default Login;
