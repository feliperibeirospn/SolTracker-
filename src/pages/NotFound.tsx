import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div>
      <h1>404 - Página Não Encontrada</h1>
      <Link to="/">Voltar para o Início</Link>
    </div>
  );
};

export default NotFound;
