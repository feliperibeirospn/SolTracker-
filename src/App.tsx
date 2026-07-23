import AppRoutes from './routes';
import './App.css';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';

function App() {
  const { isAuthenticated } = useAuth();

  // AJUSTE CRÍTICO: Verifica se é portal público antes de decidir se mostra Login
  const isPublicPortal = window.location.hash.includes('#/p/');

  // Se não estiver logado E não for um link de portal, mostra Login
  if (!isAuthenticated && !isPublicPortal) {
    return (
      <>
        <Toaster position="top-right" />
        <Login />
      </>
    );
  }

  // Caso contrário, renderiza as rotas (que já sabem lidar com o portal público)
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-color)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;
