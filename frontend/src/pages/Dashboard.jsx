import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PlanoEstudos from './PlanoEstudos';
import Questoes from './Questoes';
import Redacoes from './Redacoes';
import Simulados from './Simulados';
import Progresso from './Progresso';
import Configuracoes from './Configuracoes';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ questoes: 0, redacoes: 0 });

  const isPremium = user?.current_plan_id > 1;

  // Carregar estatísticas ao montar
  useEffect(() => {
    carregarStats();
  }, []);

  const carregarStats = async () => {
    try {
      const [questoesRes] = await Promise.all([api.get('/questions/stats')]);

      if (questoesRes.data.success) {
        setStats((prev) => ({
          ...prev,
          questoes: questoesRes.data.data.geral.total_answered || 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'plano':
        return <PlanoEstudos />;
      case 'questoes':
        return <Questoes />;
      case 'redacoes':
        return <Redacoes />;
      case 'simulados':
        return <Simulados />;
      case 'progresso':
        return <Progresso />;
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return (
          <HomeContent
            user={user}
            isPremium={isPremium}
            setActiveTab={setActiveTab}
            stats={stats}
          />
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            {/* Se sidebarOpen for verdadeiro mostra o nome completo, senão mostra SA */}
            <h1>{sidebarOpen ? 'SempreAprender' : 'SA'}</h1>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
            onClick={() => setActiveTab('inicio')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Início</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'plano' ? 'active' : ''}`}
            onClick={() => setActiveTab('plano')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Plano de Estudos</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'questoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('questoes')}
          >
            <span className="nav-icon">❓</span>
            <span className="nav-text">Questões</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'redacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('redacoes')}
          >
            <span className="nav-icon">✍️</span>
            <span className="nav-text">Redações</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'simulados' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulados')}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Simulados</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'progresso' ? 'active' : ''}`}
            onClick={() => setActiveTab('progresso')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Progresso</span>
          </button>

          <div className="nav-divider"></div>

          {!isPremium && (
            <button
              className="nav-item upgrade-btn"
              onClick={() => setActiveTab('upgrade')}
            >
              <span className="nav-icon">⭐</span>
              <span className="nav-text">Assinar Premium</span>
            </button>
          )}

          <button
            className={`nav-item ${activeTab === 'configuracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuracoes')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Configurações</span>
          </button>

          <button className="nav-item logout-btn" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Sair</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-plan">
                {isPremium ? '⭐ Premium' : '🆓 Gratuito'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">{renderContent()}</div>
      </main>
    </div>
  );
};

// Componente de Conteúdo Inicial
const HomeContent = ({ user, isPremium, setActiveTab, stats }) => {
  return (
    <>
      <div className="welcome-section">
        <h2>Bem-vindo(a), {user?.name}! 🎓</h2>
        <p>Vamos começar seus estudos hoje?</p>
        {!isPremium && stats.questoes > 0 && (
          <div className="usage-info">
            📊 Você já respondeu {stats.questoes} questões este mês (limite: 50)
          </div>
        )}
      </div>

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

      {!isPremium && (
        <div className="upgrade-banner">
          <div className="upgrade-content">
            <h3>🚀 Desbloqueie Todo o Potencial!</h3>
            <p>
              Assine o plano Premium e tenha acesso ilimitado a todas as
              funcionalidades
            </p>
            <ul className="upgrade-benefits">
              <li>✓ Questões ilimitadas</li>
              <li>✓ Correções de redação ilimitadas</li>
              <li>✓ Simulados completos</li>
              <li>✓ Análise detalhada de desempenho</li>
            </ul>
            <button
              className="btn-upgrade"
              onClick={() => setActiveTab('upgrade')}
            >
              Assinar Premium - R$ 49,90/mês
            </button>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="actions-grid">
          <button className="action-card" onClick={() => setActiveTab('plano')}>
            <span className="action-icon">📅</span>
            <span className="action-title">Ver Plano de Estudos</span>
          </button>
          <button
            className="action-card"
            onClick={() => setActiveTab('questoes')}
          >
            <span className="action-icon">❓</span>
            <span className="action-title">Resolver Questões</span>
          </button>
          <button
            className="action-card"
            onClick={() => setActiveTab('redacoes')}
          >
            <span className="action-icon">✍️</span>
            <span className="action-title">Enviar Redação</span>
          </button>
          <button
            className="action-card"
            onClick={() => setActiveTab('simulados')}
          >
            <span className="action-icon">📝</span>
            <span className="action-title">Fazer Simulado</span>
          </button>
        </div>
      </div>

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
                {isPremium ? 'Premium ⭐' : 'Gratuito 🆓'}
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
    </>
  );
};

export default Dashboard;
