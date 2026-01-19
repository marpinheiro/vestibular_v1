import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// URL da API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PlanoEstudos = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('meus-planos');
  const [planos, setPlanos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [planoAtual, setPlanoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingAPI, setUsingAPI] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    objetivo: '',
    vestibular: user?.vestibular || 'enem',
    horasPorDia: 2,
    diasPorSemana: [],
    dataInicio: '',
    dataFim: '',
    materias: [],
  });

  const diasSemana = [
    { id: 'seg', nome: 'Segunda' },
    { id: 'ter', nome: 'Terça' },
    { id: 'qua', nome: 'Quarta' },
    { id: 'qui', nome: 'Quinta' },
    { id: 'sex', nome: 'Sexta' },
    { id: 'sab', nome: 'Sábado' },
    { id: 'dom', nome: 'Domingo' },
  ];

  const materiasDisponiveis = [
    'Matemática',
    'Português',
    'Física',
    'Química',
    'Biologia',
    'História',
    'Geografia',
    'Inglês',
    'Filosofia',
    'Sociologia',
    'Literatura',
    'Redação',
  ];

  // 🆕 CARREGAR PLANOS DA API OU LOCALSTORAGE
  useEffect(() => {
    if (!user?.id) return;

    const carregarDados = async () => {
      try {
        // 1️⃣ TENTAR API PRIMEIRO
        console.log('🔄 Tentando carregar planos da API...');
        const response = await fetch(`${API_URL}/plano-estudos/${user.id}`);

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            console.log(
              '✅ Planos carregados da API:',
              result.data.length,
              'plano(s)',
            );
            setPlanos(result.data);
            setUsingAPI(true);

            // Salvar backup no localStorage
            localStorage.setItem(
              `planos_${user.id}`,
              JSON.stringify(result.data),
            );

            // Definir plano ativo
            const ativo = result.data.find((p) => p.ativo);
            if (ativo) {
              setPlanoAtual(ativo);
            }

            setLoading(false);
            return;
          }
        }

        // 2️⃣ FALLBACK: USAR LOCALSTORAGE
        console.log('⚠️ API indisponível, usando localStorage');
        setUsingAPI(false);

        const planosStorage = localStorage.getItem(`planos_${user.id}`);
        if (planosStorage) {
          const planosData = JSON.parse(planosStorage);
          setPlanos(planosData);

          const ativo = planosData.find((p) => p.ativo);
          if (ativo) {
            setPlanoAtual(ativo);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar planos:', error);
        setUsingAPI(false);

        // Fallback final: localStorage
        try {
          const planosStorage = localStorage.getItem(`planos_${user.id}`);
          if (planosStorage) {
            const planosData = JSON.parse(planosStorage);
            setPlanos(planosData);

            const ativo = planosData.find((p) => p.ativo);
            if (ativo) {
              setPlanoAtual(ativo);
            }
          }
        } catch (e) {
          console.error('❌ Erro no fallback:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user?.id]);

  // 🆕 RECARREGAR PLANOS DA API
  const recarregarPlanos = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/plano-estudos/${user.id}`);

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          setPlanos(result.data);
          localStorage.setItem(
            `planos_${user.id}`,
            JSON.stringify(result.data),
          );

          const ativo = result.data.find((p) => p.ativo);
          if (ativo) {
            setPlanoAtual(ativo);
          }

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao recarregar planos:', error);
      return false;
    }
  }, [user?.id]);

  // Função para salvar no localStorage (fallback)
  const salvarPlanos = useCallback(
    (novosPlanos) => {
      try {
        localStorage.setItem(`planos_${user?.id}`, JSON.stringify(novosPlanos));
        setPlanos(novosPlanos);
      } catch (error) {
        console.error('Erro ao salvar planos:', error);
      }
    },
    [user?.id],
  );

  const handleDiaToggle = (diaId) => {
    setFormData((prev) => ({
      ...prev,
      diasPorSemana: prev.diasPorSemana.includes(diaId)
        ? prev.diasPorSemana.filter((d) => d !== diaId)
        : [...prev.diasPorSemana, diaId],
    }));
  };

  const handleMateriaToggle = (materia) => {
    setFormData((prev) => ({
      ...prev,
      materias: prev.materias.includes(materia)
        ? prev.materias.filter((m) => m !== materia)
        : [...prev.materias, materia],
    }));
  };

  const calcularDiasTotais = (dataInicio, dataFim, diasSemana) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    let dias = 0;

    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      const diaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][
        d.getDay()
      ];
      if (diasSemana.includes(diaSemana)) {
        dias++;
      }
    }

    return dias;
  };

  // 🆕 CRIAR PLANO - COM API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.nome || !formData.dataInicio || !formData.dataFim) {
      setSuccessMessage('❌ Preencha todos os campos obrigatórios');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      return;
    }

    if (formData.diasPorSemana.length === 0) {
      setSuccessMessage('❌ Selecione pelo menos um dia da semana');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      return;
    }

    if (formData.materias.length === 0) {
      setSuccessMessage('❌ Selecione pelo menos uma matéria');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      return;
    }

    try {
      // 1️⃣ TENTAR SALVAR NA API
      console.log('🔄 Salvando plano na API...');
      const response = await fetch(`${API_URL}/plano-estudos/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Plano salvo na API:', result);

        // Recarregar lista da API
        await recarregarPlanos();

        setSuccessMessage('✅ Plano criado com sucesso!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
        setShowModal(false);

        // Limpar formulário
        setFormData({
          nome: '',
          objetivo: '',
          vestibular: user?.vestibular || 'enem',
          horasPorDia: 2,
          diasPorSemana: [],
          dataInicio: '',
          dataFim: '',
          materias: [],
        });

        return;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar na API:', error);
      console.log('⚠️ Salvando apenas no localStorage');
    }

    // 2️⃣ FALLBACK: SALVAR NO LOCALSTORAGE
    const totalDias = calcularDiasTotais(
      formData.dataInicio,
      formData.dataFim,
      formData.diasPorSemana,
    );

    const novoPlano = {
      id: Date.now(),
      ...formData,
      ativo: planos.length === 0,
      criadoEm: new Date().toISOString(),
      progresso: {
        diasCumpridos: 0,
        totalDias: totalDias,
        horasEstudadas: 0,
        horasTotal: totalDias * formData.horasPorDia,
      },
    };

    const novosPlanos = [...planos, novoPlano];
    salvarPlanos(novosPlanos);

    if (planos.length === 0) {
      setPlanoAtual(novoPlano);
    }

    setShowModal(false);
    setFormData({
      nome: '',
      objetivo: '',
      vestibular: user?.vestibular || 'enem',
      horasPorDia: 2,
      diasPorSemana: [],
      dataInicio: '',
      dataFim: '',
      materias: [],
    });

    setSuccessMessage('✅ Plano criado com sucesso!');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // 🆕 ATIVAR PLANO - COM API
  const ativarPlano = async (planoId) => {
    try {
      // 1️⃣ TENTAR API
      const response = await fetch(
        `${API_URL}/api/plano-estudos/${user.id}/${planoId}/ativar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        console.log('✅ Plano ativado na API');
        await recarregarPlanos();

        setSuccessMessage('✅ Plano ativado com sucesso!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao ativar plano na API:', error);
    }

    // 2️⃣ FALLBACK: LOCALSTORAGE
    const novosPlanos = planos.map((p) => ({
      ...p,
      ativo: p.id === planoId,
    }));

    salvarPlanos(novosPlanos);

    const planoAtivado = novosPlanos.find((p) => p.id === planoId);
    setPlanoAtual(planoAtivado);

    setSuccessMessage('✅ Plano ativado com sucesso!');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // 🆕 EXCLUIR PLANO - COM API
  const excluirPlano = async (planoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) {
      return;
    }

    try {
      // 1️⃣ TENTAR API
      const response = await fetch(
        `${API_URL}/api/plano-estudos/${user.id}/${planoId}`,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        console.log('✅ Plano excluído na API');
        await recarregarPlanos();

        if (planoAtual?.id === planoId) {
          setPlanoAtual(null);
        }

        setSuccessMessage('✅ Plano excluído com sucesso!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao excluir plano na API:', error);
    }

    // 2️⃣ FALLBACK: LOCALSTORAGE
    const novosPlanos = planos.filter((p) => p.id !== planoId);
    salvarPlanos(novosPlanos);

    if (planoAtual?.id === planoId) {
      setPlanoAtual(null);
    }

    setSuccessMessage('✅ Plano excluído com sucesso!');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // 🆕 REGISTRAR ESTUDO - COM API
  const registrarEstudo = async (horas) => {
    if (!planoAtual) return;

    try {
      // 1️⃣ TENTAR API
      const response = await fetch(
        `${API_URL}/api/plano-estudos/${user.id}/${planoAtual.id}/registrar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            horas: horas,
            data: new Date().toISOString().split('T')[0],
          }),
        },
      );

      if (response.ok) {
        console.log('✅ Estudo registrado na API');
        await recarregarPlanos();

        setSuccessMessage(`✅ ${horas}h de estudo registradas!`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao registrar estudo na API:', error);
    }

    // 2️⃣ FALLBACK: LOCALSTORAGE
    const novosPlanos = planos.map((p) => {
      if (p.id === planoAtual.id) {
        return {
          ...p,
          progresso: {
            ...p.progresso,
            diasCumpridos: p.progresso.diasCumpridos + 1,
            horasEstudadas: p.progresso.horasEstudadas + horas,
          },
        };
      }
      return p;
    });

    salvarPlanos(novosPlanos);

    const planoAtualizado = novosPlanos.find((p) => p.id === planoAtual.id);
    setPlanoAtual(planoAtualizado);

    setSuccessMessage(`✅ ${horas}h de estudo registradas!`);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
          <div style={{ color: '#666' }}>Carregando planos...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 🆕 INDICADOR DE MODO */}
      {!usingAPI && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>💾</span>
          <div>
            <strong>Modo Offline</strong>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Dados salvos apenas localmente. Conecte-se à API para sincronizar.
            </div>
          </div>
        </div>
      )}

      {/* Toast de Sucesso */}
      {showSuccessModal && (
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
      )}

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>
          📅 Plano de Estudos
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
          Organize sua rotina e alcance seus objetivos
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('meus-planos')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background:
              activeTab === 'meus-planos'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f3f4f6',
            color: activeTab === 'meus-planos' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          📋 Meus Planos
        </button>
        <button
          onClick={() => setActiveTab('plano-ativo')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background:
              activeTab === 'plano-ativo'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f3f4f6',
            color: activeTab === 'plano-ativo' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          ⭐ Plano Ativo
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'meus-planos' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
              Meus Planos de Estudo
            </h2>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            >
              ➕ Criar Novo Plano
            </button>
          </div>

          {planos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📚</div>
              <h3 style={{ color: '#6b7280', marginBottom: '10px' }}>
                Nenhum plano criado ainda
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
                Crie seu primeiro plano de estudos e comece a organizar sua
                rotina!
              </p>
              <button
                onClick={() => setShowModal(true)}
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
                }}
              >
                Criar Primeiro Plano
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: plano.ativo
                      ? '2px solid #10b981'
                      : '2px solid #e5e7eb',
                    position: 'relative',
                  }}
                >
                  {plano.ativo && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                      }}
                    >
                      ✓ ATIVO
                    </div>
                  )}

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem' }}>
                    {plano.nome}
                  </h3>

                  {plano.objetivo && (
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.9rem',
                        marginBottom: '15px',
                      }}
                    >
                      {plano.objetivo}
                    </p>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                      }}
                    >
                      <span>Progresso de Dias</span>
                      <span>
                        {plano.progresso.diasCumpridos}/
                        {plano.progresso.totalDias} dias
                      </span>
                    </div>
                    <ProgressBar
                      current={plano.progresso.diasCumpridos}
                      max={plano.progresso.totalDias}
                      color="#667eea"
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '15px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ color: '#6b7280' }}>Horas/dia</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {plano.horasPorDia}h
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Dias/semana</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {plano.diasPorSemana?.length || 0} dias
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Matérias</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {plano.materias?.length || 0} matérias
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Horas estudadas</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {plano.progresso.horasEstudadas}h
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!plano.ativo && (
                      <button
                        onClick={() => ativarPlano(plano.id)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid #10b981',
                          background: 'white',
                          color: '#10b981',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      onClick={() => excluirPlano(plano.id)}
                      style={{
                        flex: plano.ativo ? 1 : 'none',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '2px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'plano-ativo' && (
        <div>
          {!planoAtual ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⭐</div>
              <h3 style={{ color: '#6b7280', marginBottom: '10px' }}>
                Nenhum plano ativo
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
                Crie um plano ou ative um existente para começar!
              </p>
              <button
                onClick={() => setActiveTab('meus-planos')}
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
                }}
              >
                Ver Meus Planos
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '30px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  border: '2px solid #10b981',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '2rem',
                        color: '#1f2937',
                      }}
                    >
                      {planoAtual.nome}
                    </h2>
                    {planoAtual.objetivo && (
                      <p style={{ color: '#6b7280', margin: 0 }}>
                        {planoAtual.objetivo}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                    }}
                  >
                    ✓ ATIVO
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '25px',
                  }}
                >
                  <div
                    style={{
                      background: '#f0fdf4',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #10b981',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        color: '#10b981',
                        marginBottom: '5px',
                      }}
                    >
                      {planoAtual.progresso.horasEstudadas}h
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      Horas Estudadas
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#eff6ff',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #667eea',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        color: '#667eea',
                        marginBottom: '5px',
                      }}
                    >
                      {planoAtual.materias?.length || 0}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      Matérias
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#fef3c7',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #f59e0b',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        color: '#f59e0b',
                        marginBottom: '5px',
                      }}
                    >
                      {planoAtual.diasPorSemana?.length || 0}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      Dias por Semana
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#fce7f3',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #ec4899',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        color: '#ec4899',
                        marginBottom: '5px',
                      }}
                    >
                      {planoAtual.horasPorDia}h
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      Horas por Dia
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      Progresso Geral
                    </span>
                    <span style={{ color: '#6b7280' }}>
                      {Math.round(
                        (planoAtual.progresso.horasEstudadas /
                          planoAtual.progresso.horasTotal) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <ProgressBar
                    current={planoAtual.progresso.horasEstudadas}
                    max={planoAtual.progresso.horasTotal}
                    color="#10b981"
                  />
                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '0.85rem',
                      color: '#6b7280',
                    }}
                  >
                    {planoAtual.progresso.horasEstudadas} de{' '}
                    {planoAtual.progresso.horasTotal} horas
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '25px',
                  }}
                >
                  <button
                    onClick={() => registrarEstudo(planoAtual.horasPorDia)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      background:
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    ✓ Registrar {planoAtual.horasPorDia}h de Estudo
                  </button>
                  <button
                    onClick={() => {
                      const horas = prompt(
                        'Quantas horas deseja registrar?',
                        planoAtual.horasPorDia,
                      );
                      if (horas && !isNaN(horas) && horas > 0) {
                        registrarEstudo(Number(horas));
                      }
                    }}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '8px',
                      border: '2px solid #10b981',
                      background: 'white',
                      color: '#10b981',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    ⚙️
                  </button>
                </div>

                <div>
                  <h3
                    style={{
                      margin: '0 0 15px 0',
                      fontSize: '1.25rem',
                      color: '#1f2937',
                    }}
                  >
                    📚 Matérias do Plano
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {planoAtual.materias?.map((materia, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#f3f4f6',
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontWeight: '500',
                          color: '#374151',
                        }}
                      >
                        {materia}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background:
                    'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '2px solid #f59e0b',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                  💡 Dica
                </div>
                <p style={{ margin: 0, color: '#78350f' }}>
                  Mantenha a consistência! Registre suas horas de estudo
                  diariamente para acompanhar seu progresso.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criar Plano */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />

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
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
                📅 Criar Plano de Estudos
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Plano ENEM 2026"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Objetivo (opcional)
                </label>
                <textarea
                  value={formData.objetivo}
                  onChange={(e) =>
                    setFormData({ ...formData, objetivo: e.target.value })
                  }
                  placeholder="Ex: Focar em exatas e redação"
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Horas de Estudo por Dia: {formData.horasPorDia}h
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={formData.horasPorDia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      horasPorDia: parseInt(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    accentColor: '#667eea',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                  }}
                >
                  <span>1h</span>
                  <span>12h</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Dias da Semana *
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => handleDiaToggle(dia.id)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: formData.diasPorSemana.includes(dia.id)
                          ? '#667eea'
                          : '#e5e7eb',
                        background: formData.diasPorSemana.includes(dia.id)
                          ? '#667eea'
                          : 'white',
                        color: formData.diasPorSemana.includes(dia.id)
                          ? 'white'
                          : '#374151',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {dia.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Data Início *
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) =>
                      setFormData({ ...formData, dataInicio: e.target.value })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) =>
                      setFormData({ ...formData, dataFim: e.target.value })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Matérias para Estudar *
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '5px',
                  }}
                >
                  {materiasDisponiveis.map((materia) => (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => handleMateriaToggle(materia)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: formData.materias.includes(materia)
                          ? '#10b981'
                          : '#e5e7eb',
                        background: formData.materias.includes(materia)
                          ? '#10b981'
                          : 'white',
                        color: formData.materias.includes(materia)
                          ? 'white'
                          : '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {formData.materias.includes(materia) && '✓ '}
                      {materia}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem',
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
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  Criar Plano
                </button>
              </div>
            </form>
          </div>

          <style>{`
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
      )}
    </div>
  );
};

export default PlanoEstudos;
