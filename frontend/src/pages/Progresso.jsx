import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Ícones como componentes simples (sem lucide-react)
const TrendingUp = () => <span>📈</span>;
const Book = () => <span>📚</span>;
const Trophy = () => <span>🏆</span>;
const Target = () => <span>🎯</span>;
const Star = () => <span>⭐</span>;
const X = () => <span>✕</span>;

const Progresso = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const [stats, setStats] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Estados para modais profissionais
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [metaForm, setMetaForm] = useState({
    name: '',
    description: '',
    type: 'level',
    target: '',
  });

  const carregarStats = useCallback(
    async (period = 'week') => {
      try {
        const response = await api.get(
          `/progresso/${user.id}/stats?period=${period}`,
        );

        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Dados simulados
        setStats({
          atividades: [],
          totalQuestoes: 0,
          totalAcertos: 0,
          totalXP: 0,
          totalStudyTime: 0,
          taxaAcerto: 0,
        });
      }
    },
    [user.id],
  );

  const carregarProgresso = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando progresso do usuário:', user.id);

      const response = await api.get(`/progresso/${user.id}`);
      console.log('📊 Resposta da API:', response.data);

      if (response.data.success) {
        setProgresso(response.data.data);
        console.log('✅ Progresso carregado:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error);
      console.error('Detalhes do erro:', error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erro ao conectar com o servidor';

      setError(errorMessage);

      // Dados simulados apenas se houver erro
      console.warn('⚠️ Usando dados simulados devido ao erro:', errorMessage);
      setProgresso({
        level: user?.level || 1,
        xp: user?.xp || 0,
        totalXP: 500,
        xpToNextLevel: 250,
        streak: user?.streak_days || 0,
        maxStreak: user?.streak_days || 0,
        completedTasks: 0,
        totalQuestoes: 0,
        totalAcertos: 0,
        totalStudyTime: 0,
        conquistas: [],
        metas: [],
        progressoPorMateria: [],
        stats: { taxaAcertoGeral: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      console.log('👤 Usuário logado:', user);
      console.log('🆔 UserID:', user.id);
      carregarProgresso();
      carregarStats('week');
    }
  }, [user, carregarProgresso, carregarStats]);

  const completarTarefa = async (xp, type) => {
    try {
      const response = await api.post(`/progresso/${user.id}/task`, {
        xp,
        type,
      });

      if (response.data.success) {
        await carregarProgresso();

        if (
          response.data.newAchievements &&
          response.data.newAchievements.length > 0
        ) {
          setNewAchievements(response.data.newAchievements);
          setShowAchievementModal(true);

          setTimeout(() => {
            setShowAchievementModal(false);
          }, 5000);
        }

        await carregarStats('week');

        // Mostrar modal de sucesso profissional
        setSuccessMessage(`Tarefa completada! +${xp} XP ganhos! 🎉`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      }
    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
      setSuccessMessage('❌ Erro ao completar tarefa. Tente novamente.');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const handleMetaSubmit = async (e) => {
    e.preventDefault();

    if (!metaForm.name || !metaForm.target) {
      setSuccessMessage('❌ Preencha todos os campos obrigatórios');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      return;
    }

    try {
      const response = await api.post(`/progresso/${user.id}/meta`, {
        name: metaForm.name,
        description:
          metaForm.description ||
          `Alcançar ${metaForm.target} ${metaForm.type}`,
        type: metaForm.type,
        target: parseInt(metaForm.target),
      });

      if (response.data.success) {
        await carregarProgresso();
        setShowMetaModal(false);
        setMetaForm({ name: '', description: '', type: 'level', target: '' });

        setSuccessMessage('✅ Meta criada com sucesso!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      }
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      setSuccessMessage('❌ Erro ao criar meta. Tente novamente.');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const ProgressBar = ({ current, max, color = '#667eea' }) => (
    <div
      style={{
        width: '100%',
        height: '12px',
        background: '#e5e7eb',
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min((current / max) * 100, 100)}%`,
          height: '100%',
          background: color,
          transition: 'width 0.5s ease-out',
        }}
      />
    </div>
  );

  // Modal de Sucesso/Notificação Profissional
  const SuccessModal = () =>
    showSuccessModal && (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: successMessage.includes('❌')
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '20px 30px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease-out',
          minWidth: '300px',
          maxWidth: '400px',
        }}
      >
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
          {successMessage}
        </p>
      </div>
    );

  // Modal de Nova Meta Profissional
  const MetaModal = () =>
    showMetaModal && (
      <>
        {/* Overlay */}
        <div
          onClick={() => setShowMetaModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-out',
          }}
        />

        {/* Modal */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            zIndex: 1000,
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
              🎯 Criar Nova Meta
            </h2>
            <button
              onClick={() => setShowMetaModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '5px',
                lineHeight: 1,
              }}
            >
              <X />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleMetaSubmit}>
            {/* Nome */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.95rem',
                }}
              >
                Nome da Meta *
              </label>
              <input
                type="text"
                value={metaForm.name}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, name: e.target.value })
                }
                placeholder="Ex: Alcançar nível 10"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.95rem',
                }}
              >
                Tipo *
              </label>
              <select
                value={metaForm.type}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, type: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  background: 'white',
                }}
              >
                <option value="level">⭐ Nível</option>
                <option value="tasks">✅ Tarefas Completadas</option>
                <option value="streak">🔥 Sequência de Dias</option>
                <option value="questions">📝 Questões Respondidas</option>
                <option value="study_time">⏱️ Tempo de Estudo (minutos)</option>
                <option value="accuracy">🎯 Taxa de Acerto (%)</option>
              </select>
            </div>

            {/* Valor Alvo */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.95rem',
                }}
              >
                Valor Alvo *
              </label>
              <input
                type="number"
                value={metaForm.target}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, target: e.target.value })
                }
                placeholder="Ex: 10"
                min="1"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '25px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.95rem',
                }}
              >
                Descrição (opcional)
              </label>
              <textarea
                value={metaForm.description}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, description: e.target.value })
                }
                placeholder="Adicione uma descrição para sua meta..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Botões */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setShowMetaModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                Criar Meta
              </button>
            </div>
          </form>
        </div>

        {/* Animações CSS */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </>
    );

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '1.2rem',
          color: '#666',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
          <div>Carregando seu progresso...</div>
        </div>
      </div>
    );
  }

  if (!progresso) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '1.2rem',
          color: '#e11d48',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
          <div>Erro ao carregar dados</div>
          {error && (
            <div
              style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}
            >
              {error}
            </div>
          )}
          <button
            onClick={carregarProgresso}
            style={{
              marginTop: '20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Modais Profissionais */}
      <SuccessModal />
      <MetaModal />

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>
          📊 Acompanhamento de Progresso
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {error ? (
            <span style={{ color: '#fef08a' }}>
              ⚠️ Usando dados simulados - {error}
            </span>
          ) : (
            `Olá, ${user?.name || 'Estudante'}! Acompanhe suas conquistas e evolução nos estudos`
          )}
        </p>
      </div>

      {/* Navegação por Abas */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp },
          { id: 'stats', label: '📈 Estatísticas', icon: Book },
          { id: 'achievements', label: '🏆 Conquistas', icon: Trophy },
          { id: 'goals', label: '🎯 Metas', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 1 200px',
              padding: '15px 25px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? '#667eea' : 'white',
              color: activeTab === tab.id ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow:
                activeTab === tab.id
                  ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              fontSize: '1rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modal de Conquista */}
      {showAchievementModal && newAchievements.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '20px 30px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.5s ease-out',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>🎉 Nova Conquista!</h3>
          {newAchievements.map((ach, i) => (
            <div key={i}>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                {ach.icon} {ach.name}
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                +{ach.xp} XP
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Cards de Resumo */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            {/* Nível */}
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <span style={{ fontSize: '2rem' }}>⭐</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Nível</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {progresso.level}
              </div>
              <div style={{ marginTop: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '5px',
                    opacity: 0.9,
                  }}
                >
                  <span>{progresso.xp} XP</span>
                  <span>{progresso.xpToNextLevel} XP</span>
                </div>
                <ProgressBar
                  current={progresso.xp}
                  max={progresso.xpToNextLevel}
                  color="#fbbf24"
                />
              </div>
            </div>

            {/* Sequência */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🔥</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Sequência
                </span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {progresso.streak} {progresso.streak === 1 ? 'dia' : 'dias'}
              </div>
              <div
                style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.9 }}
              >
                Máximo: {progresso.maxStreak}{' '}
                {progresso.maxStreak === 1 ? 'dia' : 'dias'}
              </div>
            </div>

            {/* Tarefas Completadas */}
            <div
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <span style={{ fontSize: '2rem' }}>✅</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Tarefas
                </span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {progresso.completedTasks}
              </div>
              <div
                style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.9 }}
              >
                Completadas
              </div>
            </div>

            {/* Taxa de Acerto */}
            <div
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🎯</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Precisão
                </span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {progresso.stats?.taxaAcertoGeral?.toFixed(1) || '0.0'}%
              </div>
              <div
                style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.9 }}
              >
                {progresso.totalAcertos}/{progresso.totalQuestoes} acertos
              </div>
            </div>
          </div>

          {/* Progresso por Matéria */}
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '30px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>📚 Progresso por Matéria</h3>
            {progresso.progressoPorMateria &&
            progresso.progressoPorMateria.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {progresso.progressoPorMateria.map((materia, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <h4 style={{ margin: 0 }}>{materia.materiaNome}</h4>
                      <div
                        style={{
                          display: 'flex',
                          gap: '20px',
                          fontSize: '0.9rem',
                          color: '#666',
                        }}
                      >
                        <span>📝 {materia.questoesRespondidas} questões</span>
                        <span>⏱️ {materia.tempoEstudo} min</span>
                      </div>
                    </div>
                    <ProgressBar
                      current={materia.acertos}
                      max={materia.questoesRespondidas}
                      color="#667eea"
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '0.9rem',
                        color: '#666',
                      }}
                    >
                      <span>
                        {materia.acertos}/{materia.questoesRespondidas} acertos
                      </span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            Number(materia.taxaAcerto || 0) >= 70
                              ? '#10b981'
                              : '#f59e0b',
                        }}
                      >
                        {Number(materia.taxaAcerto || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#666',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📚</div>
                <p>Nenhuma atividade registrada ainda</p>
                <p style={{ fontSize: '0.9rem' }}>
                  Comece a responder questões para ver seu progresso aqui!
                </p>
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>⚡ Ações Rápidas</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
              }}
            >
              <button
                onClick={() => completarTarefa(50, 'small')}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                ✅ Completar Tarefa (+50 XP)
              </button>
              <button
                onClick={() => setShowMetaModal(true)}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                🎯 Nova Meta
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                🏆 Ver Conquistas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      {activeTab === 'stats' && (
        <div
          style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3 style={{ margin: 0 }}>Estatísticas</h3>
            <select
              onChange={(e) => carregarStats(e.target.value)}
              style={{
                padding: '8px 15px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
              aria-label="Selecionar período"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
            </select>
          </div>

          {stats && (
            <>
              {/* Resumo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px',
                  marginBottom: '30px',
                }}
              >
                <div
                  style={{
                    padding: '15px',
                    borderRadius: '8px',
                    background: '#f0f9ff',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                    📝
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {stats.totalQuestoes}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Questões
                  </div>
                </div>

                <div
                  style={{
                    padding: '15px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                    ✅
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {stats.totalAcertos}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Acertos
                  </div>
                </div>

                <div
                  style={{
                    padding: '15px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                    ⚡
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {stats.totalXP}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    XP Ganho
                  </div>
                </div>

                <div
                  style={{
                    padding: '15px',
                    borderRadius: '8px',
                    background: '#f5f3ff',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                    🎯
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {stats.taxaAcerto?.toFixed(1) || '0.0'}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>Taxa</div>
                </div>
              </div>

              {/* Gráfico ou mensagem se não houver dados */}
              {stats.atividades && stats.atividades.length > 0 ? (
                <div>
                  <h4>Atividades Recentes</h4>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-end',
                      height: '200px',
                      padding: '20px 0',
                    }}
                  >
                    {stats.atividades.map((day, i) => {
                      const maxQuestions = Math.max(
                        ...stats.atividades.map(
                          (d) => d.questoesRespondidas || 0,
                        ),
                        1,
                      );
                      const height =
                        maxQuestions > 0
                          ? ((day.questoesRespondidas || 0) / maxQuestions) *
                            100
                          : 0;

                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: `${height}%`,
                              minHeight:
                                (day.questoesRespondidas || 0) > 0
                                  ? '20px'
                                  : '5px',
                              background:
                                (day.questoesRespondidas || 0) > 0
                                  ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                                  : '#e5e7eb',
                              borderRadius: '4px',
                              position: 'relative',
                            }}
                            title={`${day.questoesRespondidas || 0} questões`}
                          >
                            {(day.questoesRespondidas || 0) > 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-20px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color: '#667eea',
                                }}
                              >
                                {day.questoesRespondidas}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#666',
                              textAlign: 'center',
                            }}
                          >
                            {new Date(day.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#666',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                    📊
                  </div>
                  <p>Nenhuma atividade registrada neste período</p>
                  <p style={{ fontSize: '0.9rem' }}>
                    Comece a estudar para ver suas estatísticas aqui!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Conquistas */}
      {activeTab === 'achievements' && (
        <div
          style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: 0 }}>🏆 Conquistas</h3>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              {progresso.conquistas.filter((c) => c.unlocked).length}/
              {progresso.conquistas.length} desbloqueadas
            </span>
          </div>

          {progresso.conquistas && progresso.conquistas.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {progresso.conquistas.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: '25px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: a.unlocked ? '#f59e0b' : '#e5e7eb',
                    background: a.unlocked
                      ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                      : 'white',
                    opacity: a.unlocked ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ fontSize: '3rem' }}>
                      {a.unlocked ? a.icon : '🔒'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{a.name}</h4>
                      <p
                        style={{
                          margin: '0 0 10px 0',
                          fontSize: '0.9rem',
                          color: '#666',
                        }}
                      >
                        {a.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#f59e0b',
                          fontWeight: 600,
                        }}
                      >
                        <Star />
                        <span>+{a.xp} XP</span>
                        {a.unlocked && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              background: '#10b981',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                            }}
                          >
                            ✓ Desbloqueada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏆</div>
              <p>Nenhuma conquista disponível</p>
              <p style={{ fontSize: '0.9rem' }}>
                Complete tarefas e responda questões para desbloquear
                conquistas!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Metas */}
      {activeTab === 'goals' && (
        <div
          style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3 style={{ margin: 0 }}>🎯 Metas Ativas</h3>
            <button
              onClick={() => setShowMetaModal(true)}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Nova Meta
            </button>
          </div>

          {progresso.metas && progresso.metas.length > 0 ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {progresso.metas.map((meta) => {
                const progress = (meta.current / meta.target) * 100;
                return (
                  <div
                    key={meta.id}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      border: `2px solid ${meta.completed ? '#10b981' : '#667eea'}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        alignItems: 'start',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'start',
                        }}
                      >
                        <div style={{ fontSize: '1.5rem' }}>
                          {meta.completed ? '✅' : '🎯'}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0' }}>{meta.name}</h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              color: '#666',
                            }}
                          >
                            {meta.description}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>
                        {meta.current} / {meta.target}
                      </span>
                    </div>
                    <ProgressBar
                      current={meta.current}
                      max={meta.target}
                      color={meta.completed ? '#10b981' : '#667eea'}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '0.9rem',
                        color: '#666',
                      }}
                    >
                      <span>{progress.toFixed(0)}% completo</span>
                      {meta.completed && (
                        <span
                          style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                          }}
                        >
                          ✓ Completa
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎯</div>
              <p style={{ marginBottom: '20px' }}>Nenhuma meta criada ainda</p>
              <button
                onClick={() => setShowMetaModal(true)}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Criar Primeira Meta
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: '30px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '20px',
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>💡 Dica de Progresso</h4>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '0.95rem' }}>
              Complete tarefas diariamente para manter sua sequência ativa e
              ganhar bônus de XP! Uma sequência de 30 dias desbloqueia uma
              conquista especial de 1000 XP.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progresso;
