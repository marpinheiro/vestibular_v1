import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const Questoes = () => {
  return (
    <DashboardLayout>
      <div className="page-placeholder">
        <div className="placeholder-icon">❓</div>
        <h2>Banco de Questões</h2>
        <p>
          Aqui você poderá resolver questões filtradas por matéria, ano e
          dificuldade!
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Questoes;
