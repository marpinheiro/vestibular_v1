import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const Configuracoes = () => {
  return (
    <DashboardLayout>
      <div className="page-placeholder">
        <div className="placeholder-icon">⚙️</div>
        <h2>Configurações</h2>
        <p>Gerencie seu perfil, altere senha e configure suas preferências!</p>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
