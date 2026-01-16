import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h2>Bem-vindo(a), {user?.name}! 🎓</h2>
          <p>Vamos começar seus estudos hoje?</p>
        </section>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Nível</h3>
              <p className="stat-value">{user?.level || 1}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>XP</h3>
              <p className="stat-value">{user?.xp || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🪙</div>
            <div className="stat-content">
              <h3>Moedas</h3>
              <p className="stat-value">{user?.coins || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>Sequência</h3>
              <p className="stat-value">{user?.streak_days || 0} dias</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="info-section">
          <div className="info-card">
            <h3>Seus Dados</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vestibular:</span>
                <span className="info-value">
                  {user?.vestibular?.toUpperCase()}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Plano:</span>
                <span className="info-value">
                  {user?.current_plan_id === 1 ? 'Gratuito' : 'Premium'}
                </span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Próximos Passos</h3>
            <ul className="steps-list">
              <li>✓ Conta criada com sucesso</li>
              <li>• Configure seu plano de estudos</li>
              <li>• Resolva suas primeiras questões</li>
              <li>• Envie sua primeira redação</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Ações Rápidas</h3>
          <div className="actions-grid">
            <button className="action-card">
              <span className="action-icon">📚</span>
              <span className="action-title">Criar Plano</span>
              <span className="action-desc">
                Comece sua rotina personalizada
              </span>
            </button>

            <button className="action-card">
              <span className="action-icon">❓</span>
              <span className="action-title">Resolver Questões</span>
              <span className="action-desc">
                Pratique com questões anteriores
              </span>
            </button>

            <button className="action-card">
              <span className="action-icon">✍️</span>
              <span className="action-title">Enviar Redação</span>
              <span className="action-desc">Receba correção automática</span>
            </button>

            <button className="action-card">
              <span className="action-icon">📝</span>
              <span className="action-title">Fazer Simulado</span>
              <span className="action-desc">Teste seus conhecimentos</span>
            </button>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="coming-soon">
          <h3>🚀 Em Breve</h3>
          <div className="features-grid">
            <div className="feature-item">
              📚 Plano de Estudos Personalizado
            </div>
            <div className="feature-item">❓ Banco de Questões</div>
            <div className="feature-item">✍️ Correção de Redação</div>
            <div className="feature-item">📊 Simulados</div>
            <div className="feature-item">📈 Acompanhamento de Progresso</div>
            <div className="feature-item">🎯 Metas e Conquistas</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
