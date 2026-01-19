import React from 'react';
import { useAuth } from '../context/AuthContext';

const Configuracoes = () => {
  const { user } = useAuth();

  return (
    <div className="page-content">
      <h2>⚙️ Configurações</h2>
      <p className="page-subtitle">Gerencie sua conta e preferências</p>

      <div className="settings-section">
        <h3>Informações da Conta</h3>
        <div className="settings-item">
          <label>Nome</label>
          <input type="text" defaultValue={user?.name} disabled />
        </div>
        <div className="settings-item">
          <label>Email</label>
          <input type="email" defaultValue={user?.email} disabled />
        </div>
        <div className="settings-item">
          <label>Vestibular</label>
          <input
            type="text"
            defaultValue={user?.vestibular?.toUpperCase()}
            disabled
          />
        </div>
      </div>

      <div className="coming-soon-card">
        <span className="coming-icon">🔧</span>
        <h3>Mais Opções em Breve</h3>
        <ul>
          <li>Alterar senha</li>
          <li>Upload de foto de perfil</li>
          <li>Notificações por email</li>
          <li>Preferências de estudo</li>
          <li>Integração com calendário</li>
        </ul>
      </div>
    </div>
  );
};

export default Configuracoes;
