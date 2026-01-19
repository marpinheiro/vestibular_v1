import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Simulados = () => {
  const { user } = useAuth();
  const [view, setView] = useState('dashboard'); // dashboard, criar, fazendo, resultado
  const [simulados, setSimulados] = useState([]);
  const [simuladoAtual, setSimuladoAtual] = useState(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [tempo, setTempo] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);

  // Configuração para criar simulado
  const [config, setConfig] = useState({
    vestibular: user?.vestibular || 'enem',
    totalQuestions: 45,
  });

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const carregarSimulados = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/simulados/${user.id}`);
      const data = await response.json();

      if (data.success) {
        setSimulados(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar simulados:', error);
    }
  }, [user?.id]);

  const carregarEstatisticas = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/simulados/${user.id}/stats/geral`,
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [user?.id]);

  // Carregar simulados ao montar
  useEffect(() => {
    if (user?.id) {
      carregarSimulados();
      carregarEstatisticas();
    }
  }, [user?.id, carregarSimulados, carregarEstatisticas]);

  // Timer
  useEffect(() => {
    let interval;
    if (timerAtivo) {
      interval = setInterval(() => {
        setTempo((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerAtivo]);

  const criarSimulado = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/simulados/${user.id}/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        // Carregar simulado criado
        await iniciarSimulado(data.data.id);
      } else {
        alert(data.message || 'Erro ao criar simulado');
      }
    } catch (error) {
      console.error('Erro ao criar simulado:', error);
      alert('Erro ao criar simulado');
    } finally {
      setLoading(false);
    }
  };

  const iniciarSimulado = async (simuladoId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/simulados/${user.id}/${simuladoId}`,
      );
      const data = await response.json();

      if (data.success) {
        setSimuladoAtual(data.data);
        setQuestaoAtual(0);
        setRespostas({});
        setTempo(0);
        setTimerAtivo(true);
        setView('fazendo');
      }
    } catch (error) {
      console.error('Erro ao iniciar simulado:', error);
      alert('Erro ao carregar simulado');
    } finally {
      setLoading(false);
    }
  };

  const salvarResposta = async (questionId, resposta) => {
    try {
      await fetch(
        `${API_URL}/simulados/${user.id}/${simuladoAtual.id}/questao/${questionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resposta }),
        },
      );

      setRespostas((prev) => ({
        ...prev,
        [questionId]: resposta,
      }));
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
    }
  };

  const finalizarSimulado = async () => {
    if (!window.confirm('Deseja realmente finalizar o simulado?')) {
      return;
    }

    setTimerAtivo(false);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/simulados/${user.id}/${simuladoAtual.id}/finalizar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: tempo }),
        },
      );

      const data = await response.json();

      if (data.success) {
        await verResultado(simuladoAtual.id);
        await carregarSimulados();
        await carregarEstatisticas();
      }
    } catch (error) {
      console.error('Erro ao finalizar simulado:', error);
      alert('Erro ao finalizar simulado');
    } finally {
      setLoading(false);
    }
  };

  const verResultado = async (simuladoId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/simulados/${user.id}/${simuladoId}/resultado`,
      );
      const data = await response.json();

      if (data.success) {
        setSimuladoAtual(data.data);
        setView('resultado');
      }
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  // RENDERIZAÇÃO DOS COMPONENTES

  const renderDashboard = () => (
    <div>
      {/* Header com Estatísticas */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '25px',
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {stats.total_simulados}
            </div>
            <div style={{ opacity: 0.9 }}>Simulados Realizados</div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '25px',
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {stats.media_geral}%
            </div>
            <div style={{ opacity: 0.9 }}>Média Geral</div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '25px',
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {stats.melhor_nota}%
            </div>
            <div style={{ opacity: 0.9 }}>Melhor Nota</div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              padding: '25px',
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {stats.total_questoes}
            </div>
            <div style={{ opacity: 0.9 }}>Questões Respondidas</div>
          </div>
        </div>
      )}

      {/* Botão Criar Simulado */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          onClick={() => setView('criar')}
          style={{
            padding: '20px 40px',
            fontSize: '1.2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        >
          🚀 Novo Simulado
        </button>
      </div>

      {/* Histórico de Simulados */}
      <h2 style={{ marginBottom: '20px' }}>📚 Histórico de Simulados</h2>

      {simulados.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📝</div>
          <h3 style={{ color: '#6b7280' }}>Nenhum simulado realizado</h3>
          <p style={{ color: '#9ca3af' }}>
            Comece agora e teste seus conhecimentos!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {simulados.map((simulado) => (
            <div
              key={simulado.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '15px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {simulado.title}
                </h3>
                <span
                  style={{
                    background: simulado.completed_at ? '#10b981' : '#f59e0b',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {simulado.completed_at ? 'Finalizado' : 'Em Andamento'}
                </span>
              </div>

              <div
                style={{
                  marginBottom: '15px',
                  fontSize: '0.9rem',
                  color: '#6b7280',
                }}
              >
                <div>📊 {simulado.total_questions} questões</div>
                {simulado.completed_at && (
                  <>
                    <div>✓ {simulado.correct_answers} acertos</div>
                    <div>🎯 Nota: {simulado.score}%</div>
                  </>
                )}
              </div>

              <button
                onClick={() =>
                  simulado.completed_at
                    ? verResultado(simulado.id)
                    : iniciarSimulado(simulado.id)
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: simulado.completed_at ? '#667eea' : '#10b981',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {simulado.completed_at ? 'Ver Resultado' : 'Continuar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCriar = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => setView('dashboard')}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '2px solid #e5e7eb',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        ← Voltar
      </button>

      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>
          🚀 Criar Novo Simulado
        </h2>

        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
            }}
          >
            Vestibular
          </label>
          <select
            value={config.vestibular}
            onChange={(e) =>
              setConfig({ ...config, vestibular: e.target.value })
            }
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
            }}
          >
            <option value="enem">ENEM</option>
            <option value="fuvest">FUVEST</option>
            <option value="unicamp">UNICAMP</option>
            <option value="unesp">UNESP</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
            }}
          >
            Quantidade de Questões: {config.totalQuestions}
          </label>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={config.totalQuestions}
            onChange={(e) =>
              setConfig({ ...config, totalQuestions: parseInt(e.target.value) })
            }
            style={{ width: '100%', accentColor: '#667eea' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: '#6b7280',
            }}
          >
            <span>10</span>
            <span>90</span>
          </div>
        </div>

        <button
          onClick={criarSimulado}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: 'none',
            background: loading
              ? '#9ca3af'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}
        >
          {loading ? '⏳ Gerando...' : '✨ Gerar Simulado'}
        </button>
      </div>
    </div>
  );

  const renderFazendo = () => {
    if (!simuladoAtual || !simuladoAtual.questoes) return null;

    const questao = simuladoAtual.questoes[questaoAtual];
    const totalQuestoes = simuladoAtual.questoes.length;
    const respondidas = Object.keys(respostas).length;

    return (
      <div>
        {/* Header com Timer e Progresso */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>{simuladoAtual.title}</h3>
            <div style={{ opacity: 0.9 }}>
              Questão {questaoAtual + 1} de {totalQuestoes}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {formatarTempo(tempo)}
            </div>
            <div style={{ opacity: 0.9 }}>
              {respondidas}/{totalQuestoes} respondidas
            </div>
          </div>
        </div>

        {/* Questão */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e5e7eb',
            }}
          >
            <span
              style={{
                background: '#f3f4f6',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              {questao.subject}
            </span>
            <span
              style={{
                background:
                  questao.difficulty === 'easy'
                    ? '#10b981'
                    : questao.difficulty === 'medium'
                      ? '#f59e0b'
                      : '#ef4444',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              {questao.difficulty === 'easy'
                ? 'Fácil'
                : questao.difficulty === 'medium'
                  ? 'Médio'
                  : 'Difícil'}
            </span>
          </div>

          <div
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '30px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {questao.question_text}
          </div>

          {/* Alternativas */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            {['a', 'b', 'c', 'd', 'e'].map((opcao) => {
              if (!questao[`option_${opcao}`]) return null;

              const selecionada = respostas[questao.id] === opcao;

              return (
                <button
                  key={opcao}
                  onClick={() => salvarResposta(questao.id, opcao)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: `3px solid ${selecionada ? '#667eea' : '#e5e7eb'}`,
                    background: selecionada ? '#eff6ff' : 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '1rem',
                  }}
                >
                  <strong style={{ marginRight: '10px', fontSize: '1.2rem' }}>
                    {opcao.toUpperCase()})
                  </strong>
                  {questao[`option_${opcao}`]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navegação */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <button
            onClick={() => setQuestaoAtual(Math.max(0, questaoAtual - 1))}
            disabled={questaoAtual === 0}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              background: questaoAtual === 0 ? '#f3f4f6' : 'white',
              fontWeight: '600',
              cursor: questaoAtual === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Anterior
          </button>

          {questaoAtual < totalQuestoes - 1 ? (
            <button
              onClick={() => setQuestaoAtual(questaoAtual + 1)}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Próxima →
            </button>
          ) : (
            <button
              onClick={finalizarSimulado}
              disabled={loading}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: '8px',
                border: 'none',
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Finalizando...' : '✓ Finalizar Simulado'}
            </button>
          )}
        </div>

        {/* Mapa de Questões */}
        <div
          style={{
            marginTop: '30px',
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ marginBottom: '15px' }}>Mapa de Questões</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
              gap: '10px',
            }}
          >
            {simuladoAtual.questoes.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setQuestaoAtual(index)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${index === questaoAtual ? '#667eea' : respostas[q.id] ? '#10b981' : '#e5e7eb'}`,
                  background:
                    index === questaoAtual
                      ? '#eff6ff'
                      : respostas[q.id]
                        ? '#f0fdf4'
                        : 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color:
                    index === questaoAtual
                      ? '#667eea'
                      : respostas[q.id]
                        ? '#10b981'
                        : '#6b7280',
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderResultado = () => {
    if (!simuladoAtual || !simuladoAtual.simulado) return null;

    const { simulado, questoes, stats_by_subject } = simuladoAtual;

    return (
      <div>
        <button
          onClick={() => {
            setView('dashboard');
            setSimuladoAtual(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          ← Voltar ao Dashboard
        </button>

        {/* Resultado Geral */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '30px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>
            {simulado.score}%
          </h1>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
            {simulado.title}
          </h3>
          <div style={{ opacity: 0.9 }}>
            {simulado.correct_answers} de {simulado.total_questions} questões
            corretas
          </div>
          <div style={{ opacity: 0.9, marginTop: '10px' }}>
            ⏱️ Tempo: {formatarTempo(simulado.duration || 0)}
          </div>
        </div>

        {/* Estatísticas por Matéria */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: '20px' }}>📊 Desempenho por Matéria</h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            {stats_by_subject.map((stat) => (
              <div key={stat.subject}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{stat.subject}</span>
                  <span>
                    {stat.correct}/{stat.total} ({stat.percentage}%)
                  </span>
                </div>
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
                      width: `${stat.percentage}%`,
                      height: '100%',
                      background:
                        stat.percentage >= 70
                          ? '#10b981'
                          : stat.percentage >= 50
                            ? '#f59e0b'
                            : '#ef4444',
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gabarito */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: '20px' }}>📝 Gabarito Completo</h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {questoes.map((questao, index) => (
              <div
                key={questao.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `3px solid ${questao.is_correct ? '#10b981' : '#ef4444'}`,
                  background: questao.is_correct ? '#f0fdf4' : '#fef2f2',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                  }}
                >
                  <strong>Questão {index + 1}</strong>
                  <span
                    style={{
                      background: questao.is_correct ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {questao.is_correct ? '✓ Correta' : '✗ Errada'}
                  </span>
                </div>

                <div style={{ marginBottom: '15px', fontSize: '0.95rem' }}>
                  {questao.question_text.substring(0, 150)}...
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>
                    <strong>Sua resposta:</strong>{' '}
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#f3f4f6',
                        fontWeight: 'bold',
                      }}
                    >
                      {questao.user_answer?.toUpperCase() || 'Não respondeu'}
                    </span>
                  </div>
                  <div>
                    <strong>Gabarito:</strong>{' '}
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#10b981',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {questao.correct_answer.toUpperCase()}
                    </span>
                  </div>
                </div>

                {questao.explanation && (
                  <div
                    style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: 'white',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <strong>💡 Explicação:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {questao.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDERIZAÇÃO PRINCIPAL
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          color: 'white',
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>📝 Simulados</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Treine em condições reais de prova com 1.128 questões disponíveis
        </p>
      </div>

      {loading && view !== 'fazendo' ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>
            Carregando...
          </div>
        </div>
      ) : (
        <>
          {view === 'dashboard' && renderDashboard()}
          {view === 'criar' && renderCriar()}
          {view === 'fazendo' && renderFazendo()}
          {view === 'resultado' && renderResultado()}
        </>
      )}
    </div>
  );
};

export default Simulados;
