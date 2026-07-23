import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Clientes from '../pages/Clientes';
import NovoCliente from '../pages/NovoCliente';
import EditarCliente from '../pages/EditarCliente';
import DetalhesCliente from '../pages/DetalhesCliente';
import Financeiro from '../pages/Financeiro';
import Historico from '../pages/Historico';
import Relatorios from '../pages/Relatorios';
import Importacao from '../pages/Importacao';
import Configuracoes from '../pages/Configuracoes';
import PortalCliente from '../pages/PortalCliente';
import CalendarioFinanceiro from '../pages/CalendarioFinanceiro';
import NotFound from '../pages/NotFound';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/p/:hash" element={<PortalCliente />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
          <Route path="clientes/novo" element={<PrivateRoute><NovoCliente /></PrivateRoute>} />
          <Route path="clientes/:id" element={<PrivateRoute><DetalhesCliente /></PrivateRoute>} />
          <Route path="clientes/editar/:id" element={<PrivateRoute><EditarCliente /></PrivateRoute>} />
          <Route path="financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
          <Route path="calendario" element={<PrivateRoute><CalendarioFinanceiro /></PrivateRoute>} />
          <Route path="historico" element={<PrivateRoute><Historico /></PrivateRoute>} />
          <Route path="relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
          <Route path="importacao" element={<PrivateRoute><Importacao /></PrivateRoute>} />
          <Route path="configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
