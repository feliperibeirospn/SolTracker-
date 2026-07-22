import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <BrowserRouter basename="/SolTracker-">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<NovoCliente />} />
          <Route path="clientes/:id" element={<DetalhesCliente />} />
          <Route path="clientes/editar/:id" element={<EditarCliente />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="historico" element={<Historico />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="importacao" element={<Importacao />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
