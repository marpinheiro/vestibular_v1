import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Redacoes.css';

const Redacoes = () => {
  const { user } = useAuth();
  const [view, setView] = useState('nova'); // 'nova', 'historico', 'resultado'
  const [loading, setLoading] = useState(false);
  const [redacoes, setRedacoes] = useState([]);
  const [resultado, setResultado] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    tema: '',
    texto: '',
  });

  // Lista de temas do ENEM
  const temasEnem = [
    {
      ano: 2025,
      tema: 'Perspectivas acerca do envelhecimento na sociedade brasileira',
    },
    {
      ano: 2024,
      tema: 'Desafios para a valorização da herança africana no Brasil',
    },
    {
      ano: 2023,
      tema: 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
    },
    {
      ano: 2022,
      tema: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
    },
    {
      ano: 2021,
      tema: 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil',
    },
    {
      ano: 2020,
      tema: 'O estigma associado às doenças mentais na sociedade brasileira',
    },
    { ano: 2019, tema: 'Democratização do acesso ao cinema no Brasil' },
    {
      ano: 2018,
      tema: 'Manipulação do comportamento do usuário pelo controle de dados na internet',
    },
    {
      ano: 2017,
      tema: 'Desafios para a formação educacional de surdos no Brasil',
    },
    {
      ano: 2016,
      tema: 'Caminhos para combater a intolerância religiosa no Brasil',
    },
    {
      ano: 2015,
      tema: 'A persistência da violência contra a mulher na sociedade brasileira',
    },
    { ano: 2014, tema: 'Publicidade infantil em questão no Brasil' },
    { ano: 2013, tema: 'Efeitos da implantação da Lei Seca no Brasil' },
  ];

  const isPremium = user?.current_plan_id > 1;

  // Carregar histórico ao montar
  useEffect(() => {
    if (view === 'historico') {
      carregarHistorico();
    }
  }, [view]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const response = await api.get('/redacoes');
      if (response.data.success) {
        setRedacoes(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tema || !formData.texto) {
      alert('Selecione um tema e escreva sua redação!');
      return;
    }

    if (formData.texto.length < 200) {
      alert('A redação deve ter no mínimo 200 caracteres!');
      return;
    }

    setLoading(true);

    try {
      // Usar o tema selecionado como título se não tiver título customizado
      const titulo =
        formData.titulo || `Redação ENEM - ${formData.tema.split(':')[0]}`;

      const response = await api.post('/redacoes', {
        titulo,
        tema: formData.tema,
        texto: formData.texto,
      });

      if (response.data.success) {
        setResultado(response.data.data);
        setView('resultado');
        setFormData({ titulo: '', tema: '', texto: '' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao enviar redação';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/redacoes/${id}`);
      if (response.data.success) {
        setResultado(response.data.data);
        setView('resultado');
      }
    } catch (error) {
      alert('Erro ao carregar redação');
    } finally {
      setLoading(false);
    }
  };

  const contarPalavras = (texto) => {
    return texto
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Renderizar view de Nova Redação
  const renderNovaRedacao = () => (
    <div className="nova-redacao">
      <div className="redacao-header">
        <h2>✍️ Nova Redação</h2>
        {!isPremium && (
          <div className="limite-aviso">
            ⚠️ Plano Gratuito: 1 redação por mês
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="redacao-form">
        <div className="form-group">
          <label>Tema da Redação (ENEM) *</label>
          <select
            name="tema"
            value={formData.tema}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um tema do ENEM</option>
            {temasEnem.map((item) => (
              <option key={item.ano} value={item.tema}>
                ENEM {item.ano} - {item.tema}
              </option>
            ))}
          </select>
          <small className="tema-hint">
            💡 Escolha um dos temas oficiais do ENEM para praticar
          </small>
        </div>

        <div className="form-group">
          <label>Título da sua redação (opcional)</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ex: Minha redação sobre envelhecimento"
            maxLength={100}
          />
          <small>
            Se não preencher, será usado automaticamente o tema escolhido
          </small>
        </div>

        <div className="form-group">
          <label>
            Texto da Redação
            <span className="contador">
              {contarPalavras(formData.texto)} palavras |{' '}
              {formData.texto.length} caracteres
            </span>
          </label>
          <textarea
            name="texto"
            value={formData.texto}
            onChange={handleChange}
            placeholder="Digite sua redação aqui... (mínimo 200 caracteres)"
            rows={20}
            maxLength={5000}
          />
          <div className="texto-dicas">
            <small>
              💡 Dica: Uma boa redação do ENEM tem entre 20-30 linhas (cerca de
              400-500 palavras)
            </small>
          </div>
        </div>

        <button
          type="submit"
          className="btn-enviar"
          disabled={loading || formData.texto.length < 200}
        >
          {loading ? 'Corrigindo com IA...' : 'Enviar para Correção'}
        </button>
      </form>
    </div>
  );

  // Renderizar view de Histórico
  const renderHistorico = () => (
    <div className="historico-redacoes">
      <h2>📚 Minhas Redações</h2>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : redacoes.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não enviou nenhuma redação.</p>
          <button onClick={() => setView('nova')} className="btn-primary">
            Enviar Primeira Redação
          </button>
        </div>
      ) : (
        <div className="redacoes-lista">
          {redacoes.map((redacao) => (
            <div
              key={redacao.id}
              className="redacao-card"
              onClick={() => verDetalhes(redacao.id)}
            >
              <div className="redacao-card-header">
                <h3>{redacao.titulo}</h3>
                <span
                  className={`nota-badge ${redacao.nota_total >= 800 ? 'alta' : redacao.nota_total >= 600 ? 'media' : 'baixa'}`}
                >
                  {redacao.nota_total} pontos
                </span>
              </div>
              <p className="redacao-tema">{redacao.tema}</p>
              <div className="redacao-meta">
                <span>
                  {new Date(redacao.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className="status">{redacao.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar view de Resultado
  const renderResultado = () => {
    if (!resultado) return null;

    const sugestoes =
      typeof resultado.sugestoes === 'string'
        ? JSON.parse(resultado.sugestoes)
        : resultado.sugestoes;

    return (
      <div className="resultado-redacao">
        <div className="resultado-header">
          <h2>📊 Resultado da Correção</h2>
          <button onClick={() => setView('historico')} className="btn-voltar">
            ← Voltar
          </button>
        </div>

        <div className="nota-geral">
          <h3>Nota Total</h3>
          <div className="nota-display">{resultado.nota_total}</div>
          <p className="nota-max">de 1000 pontos</p>
        </div>

        <div className="competencias-grid">
          {[1, 2, 3, 4, 5].map((num) => {
            const nota =
              resultado[`competencia${num}`] ||
              resultado.competencias?.[`competencia${num}`];
            const detalhes = resultado.detalhes?.[`competencia${num}`];

            return (
              <div key={num} className="competencia-card">
                <div className="competencia-header">
                  <h4>Competência {num}</h4>
                  <span className="competencia-nota">{nota}/200</span>
                </div>
                {detalhes && (
                  <>
                    <p className="competencia-titulo">{detalhes.titulo}</p>
                    <div className="barra-progresso">
                      <div
                        className="barra-fill"
                        style={{ width: `${(nota / 200) * 100}%` }}
                      ></div>
                    </div>
                    <p className="competencia-feedback">{detalhes.feedback}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="feedback-section">
          <h3>💬 Feedback Geral</h3>
          <p>{resultado.feedback_geral}</p>
        </div>

        {sugestoes && sugestoes.length > 0 && (
          <div className="sugestoes-section">
            <h3>💡 Sugestões de Melhoria</h3>
            <ul>
              {sugestoes.map((sugestao, index) => (
                <li key={index}>{sugestao}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="redacao-texto-section">
          <h3>📝 Sua Redação</h3>
          <div className="redacao-texto">
            <h4>{resultado.titulo}</h4>
            <p className="tema">
              <strong>Tema:</strong> {resultado.tema}
            </p>
            <div className="texto-content">{resultado.texto}</div>
          </div>
        </div>

        <div className="acoes-resultado">
          <button onClick={() => setView('nova')} className="btn-primary">
            Enviar Nova Redação
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="redacoes-page">
      <div className="redacoes-nav">
        <button
          className={`nav-btn ${view === 'nova' ? 'active' : ''}`}
          onClick={() => setView('nova')}
        >
          ✍️ Nova Redação
        </button>
        <button
          className={`nav-btn ${view === 'historico' ? 'active' : ''}`}
          onClick={() => setView('historico')}
        >
          📚 Histórico
        </button>
      </div>

      <div className="redacoes-content">
        {view === 'nova' && renderNovaRedacao()}
        {view === 'historico' && renderHistorico()}
        {view === 'resultado' && renderResultado()}
      </div>
    </div>
  );
};

export default Redacoes;
