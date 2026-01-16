import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const Progresso = () => {
  return (
    <DashboardLayout>
      <div className="page-placeholder">
        <div className="placeholder-icon">📊</div>
        <h2>Progresso</h2>
        <p>
          Acompanhe suas estatísticas, evolução e desempenho em cada matéria!
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Progresso;
