import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Questoes.css';

const Questoes = () => {
  const { user } = useAuth();
  const [view, setView] = useState('resolver'); // 'resolver', 'estatisticas'
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    vestibular: user?.vestibular || 'enem',
    subject: '',
    topic: '',
    year: '',
    difficulty: '',
  });

  const [filtrosDisponiveis, setFiltrosDisponiveis] = useState({
    subjects: [],
    topics: [],
    years: [],
    dificuldades: [],
  });

  const isPremium = user?.current_plan_id > 1;

  // Carregar filtros disponíveis
  useEffect(() => {
    carregarFiltros();
  }, [filtros.vestibular, filtros.subject]);

  // Carregar questões ao mudar filtros
  useEffect(() => {
    if (view === 'resolver') {
      carregarQuestoes();
    }
  }, [filtros]);

  // Carregar stats ao abrir aba
  useEffect(() => {
    if (view === 'estatisticas') {
      carregarEstatisticas();
    }
  }, [view]);

  const carregarFiltros = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.vestibular) params.append('vestibular', filtros.vestibular);
      if (filtros.subject) params.append('subject', filtros.subject);

      const response = await api.get(`/questions/filters?${params}`);
      if (response.data.success) {
        setFiltrosDisponiveis(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    }
  };

  const carregarQuestoes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.keys(filtros).forEach((key) => {
        if (filtros[key]) params.append(key, filtros[key]);
      });
      params.append('limit', '10');

      const response = await api.get(`/questions?${params}`);

      if (response.data.success) {
        setQuestoes(response.data.data.questoes);
        setIndiceAtual(0);
        setQuestaoAtual(response.data.data.questoes[0]);
        setRespostaSelecionada(null);
        setMostrarResultado(false);
      }
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      alert(error.response?.data?.message || 'Erro ao carregar questões');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleRespostaClick = (opcao) => {
    if (!mostrarResultado) {
      setRespostaSelecionada(opcao);
    }
  };

  const confirmarResposta = async () => {
    if (!respostaSelecionada) {
      alert('Selecione uma resposta!');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/questions/${questaoAtual.id}/answer`, {
        answer: respostaSelecionada,
      });

      if (response.data.success) {
        setResultado(response.data.data);
        setMostrarResultado(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  const proximaQuestao = () => {
    if (indiceAtual < questoes.length - 1) {
      const novoIndice = indiceAtual + 1;
      setIndiceAtual(novoIndice);
      setQuestaoAtual(questoes[novoIndice]);
      setRespostaSelecionada(null);
      setMostrarResultado(false);
      setResultado(null);
    } else {
      alert('Você chegou ao fim! Carregando mais questões...');
      carregarQuestoes();
    }
  };

  const renderFiltros = () => (
    <div className="filtros-container">
      <h3>🔍 Filtros</h3>

      <div className="filtros-grid">
        <div className="filtro-item">
          <label>Vestibular</label>
          <select
            value={filtros.vestibular}
            onChange={(e) => handleFiltroChange('vestibular', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="enem">ENEM</option>
            <option value="fuvest">FUVEST</option>
            <option value="unicamp">UNICAMP</option>
            <option value="unesp">UNESP</option>
          </select>
        </div>

        <div className="filtro-item">
          <label>Matéria</label>
          <select
            value={filtros.subject}
            onChange={(e) => handleFiltroChange('subject', e.target.value)}
          >
            <option value="">Todas</option>
            {filtrosDisponiveis.subjects?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label>Ano</label>
          <select
            value={filtros.year}
            onChange={(e) => handleFiltroChange('year', e.target.value)}
          >
            <option value="">Todos</option>
            {filtrosDisponiveis.years?.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label>Dificuldade</label>
          <select
            value={filtros.difficulty}
            onChange={(e) => handleFiltroChange('difficulty', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      {!isPremium && (
        <div className="limite-aviso">
          ⚠️ Plano Gratuito: 50 questões por mês
        </div>
      )}
    </div>
  );

  const renderQuestao = () => {
    if (!questaoAtual) {
      return (
        <div className="empty-state">
          Nenhuma questão encontrada com os filtros selecionados.
        </div>
      );
    }

    const opcoes = ['a', 'b', 'c', 'd', 'e'].filter(
      (o) => questaoAtual[`option_${o}`],
    );

    return (
      <div className="questao-container">
        <div className="questao-header">
          <div className="questao-meta">
            <span className="badge">
              {questaoAtual.vestibular.toUpperCase()}
            </span>
            <span className="badge">{questaoAtual.subject}</span>
            <span className="badge">{questaoAtual.year}</span>
            <span className={`badge badge-${questaoAtual.difficulty}`}>
              {questaoAtual.difficulty === 'easy'
                ? 'Fácil'
                : questaoAtual.difficulty === 'medium'
                ? 'Médio'
                : 'Difícil'}
            </span>
          </div>
          <div className="questao-numero">
            Questão {indiceAtual + 1} de {questoes.length}
          </div>
        </div>

        <div className="questao-topico">
          <strong>Tópico:</strong> {questaoAtual.topic}
        </div>

        <div className="questao-texto">{questaoAtual.question_text}</div>

        <div className="opcoes-lista">
          {opcoes.map((opcao) => {
            const opcaoMaiuscula = opcao.toUpperCase();
            let className = 'opcao-item';

            if (respostaSelecionada === opcao) {
              className += ' selecionada';
            }

            if (mostrarResultado) {
              if (opcao === resultado.correct_answer) {
                className += ' correta';
              } else if (opcao === respostaSelecionada && !resultado.correct) {
                className += ' incorreta';
              }
            }

            return (
              <div
                key={opcao}
                className={className}
                onClick={() => handleRespostaClick(opcao)}
              >
                <span className="opcao-letra">{opcaoMaiuscula}</span>
                <span className="opcao-texto">
                  {questaoAtual[`option_${opcao}`]}
                </span>
              </div>
            );
          })}
        </div>

        {mostrarResultado && resultado && (
          <div
            className={`resultado-box ${
              resultado.correct ? 'correto' : 'incorreto'
            }`}
          >
            <h4>
              {resultado.correct
                ? '✓ Resposta Correta!'
                : '✗ Resposta Incorreta'}
            </h4>
            <p>
              <strong>Gabarito:</strong>{' '}
              {resultado.correct_answer.toUpperCase()}
            </p>
            {resultado.explanation && (
              <div className="explicacao">
                <strong>Explicação:</strong>
                <p>{resultado.explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="questao-acoes">
          {!mostrarResultado ? (
            <button
              className="btn-confirmar"
              onClick={confirmarResposta}
              disabled={!respostaSelecionada || loading}
            >
              {loading ? 'Verificando...' : 'Confirmar Resposta'}
            </button>
          ) : (
            <button className="btn-proxima" onClick={proximaQuestao}>
              Próxima Questão →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEstatisticas = () => {
    if (!stats) {
      return <div className="loading">Carregando estatísticas...</div>;
    }

    return (
      <div className="stats-container">
        <h2>📊 Suas Estatísticas</h2>

        <div className="stats-cards">
          <div className="stat-card-big">
            <h3>Geral</h3>
            <div className="stat-value">{stats.geral.total_answered || 0}</div>
            <p>Questões respondidas</p>
            <div className="stat-accuracy">
              Taxa de acerto: <strong>{stats.geral.accuracy || 0}%</strong>
            </div>
          </div>

          <div className="stat-card-big">
            <h3>Acertos</h3>
            <div className="stat-value correct">
              {stats.geral.total_correct || 0}
            </div>
            <p>Respostas corretas</p>
          </div>
        </div>

        <h3>Por Matéria</h3>
        <div className="stats-por-materia">
          {stats.por_materia && stats.por_materia.length > 0 ? (
            stats.por_materia.map((materia, index) => (
              <div key={index} className="materia-stat">
                <div className="materia-header">
                  <span className="materia-nome">{materia.subject}</span>
                  <span className="materia-accuracy">{materia.accuracy}%</span>
                </div>
                <div className="materia-detalhes">
                  <span>
                    {materia.correct}/{materia.total} acertos
                  </span>
                </div>
                <div className="materia-barra">
                  <div
                    className="materia-fill"
                    style={{ width: `${materia.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhuma questão respondida ainda.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="questoes-page">
      <div className="questoes-nav">
        <button
          className={`nav-btn ${view === 'resolver' ? 'active' : ''}`}
          onClick={() => setView('resolver')}
        >
          ❓ Resolver Questões
        </button>
        <button
          className={`nav-btn ${view === 'estatisticas' ? 'active' : ''}`}
          onClick={() => setView('estatisticas')}
        >
          📊 Estatísticas
        </button>
      </div>

      <div className="questoes-content">
        {view === 'resolver' && (
          <>
            {renderFiltros()}
            {loading && !questaoAtual ? (
              <div className="loading">Carregando questões...</div>
            ) : (
              renderQuestao()
            )}
          </>
        )}

        {view === 'estatisticas' && renderEstatisticas()}
      </div>
    </div>
  );
};

export default Questoes;
