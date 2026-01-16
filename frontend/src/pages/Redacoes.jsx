import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const Redacoes = () => {
  return (
    <DashboardLayout>
      <div className="page-placeholder">
        <div className="placeholder-icon">✍️</div>
        <h2>Redações</h2>
        <p>
          Envie suas redações e receba correção automática com nota e sugestões!
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Redacoes;
