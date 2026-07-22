import AppRoutes from './routes';
import './App.css';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppRoutes />;
}

export default App;
