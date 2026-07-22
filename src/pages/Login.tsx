import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MdLock, MdVpnKey, MdWbSunny } from 'react-icons/md';
import '@/styles/forms.css';

const Login: React.FC = () => {
  const { masterHash, setMasterPassword, login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const isFirstAccess = !masterHash;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFirstAccess) {
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      setMasterPassword(password);
    } else {
      const success = login(password);
      if (!success) {
        setError('Senha incorreta.');
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
          <p style={{ color: 'var(--text-secondary)' }}>
            {isFirstAccess ? 'Configurar Senha Mestre' : 'Acesso Restrito'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <MdLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                placeholder={isFirstAccess ? "Crie sua senha" : "Sua senha mestre"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
                required
              />
            </div>
          </div>

          {isFirstAccess && (
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isFirstAccess ? 'Configurar e Entrar' : 'Acessar Sistema'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isFirstAccess
            ? 'Esta senha será necessária em todos os acessos futuros.'
            : 'Proteja sua senha mestre.'}
        </p>
      </div>
    </div>
  );
};

export default Login;
