import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Configuracoes = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estado do perfil
  const [perfil, setPerfil] = useState({
    name: user?.name || '',
    email: user?.email || '',
    vestibular: user?.vestibular || 'enem',
    avatar: user?.avatar || '',
  });

  // Estado da senha
  const [senha, setSenha] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });

  // Estado das preferências
  const [preferencias, setPreferencias] = useState({
    emailNotifications: true,
    theme: 'light',
    hoursPerDay: 4,
    studyDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
  });

  const diasSemana = [
    { id: 'seg', nome: 'Seg' },
    { id: 'ter', nome: 'Ter' },
    { id: 'qua', nome: 'Qua' },
    { id: 'qui', nome: 'Qui' },
    { id: 'sex', nome: 'Sex' },
    { id: 'sab', nome: 'Sáb' },
    { id: 'dom', nome: 'Dom' },
  ];

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Salvar perfil
  const salvarPerfil = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/configuracoes/${user.id}/perfil`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(perfil),
        },
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', '✅ Perfil atualizado com sucesso!');
        // Atualizar contexto do usuário
        setUser({ ...user, ...perfil });
      } else {
        showMessage(
          'error',
          '❌ ' + (data.message || 'Erro ao atualizar perfil'),
        );
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showMessage('error', '❌ Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Alterar senha
  const alterarSenha = async () => {
    if (senha.novaSenha !== senha.confirmarSenha) {
      showMessage('error', '❌ As senhas não conferem');
      return;
    }

    if (senha.novaSenha.length < 6) {
      showMessage('error', '❌ A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/configuracoes/${user.id}/senha`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senhaAtual: senha.senhaAtual,
            novaSenha: senha.novaSenha,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', '✅ Senha alterada com sucesso!');
        setSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      } else {
        showMessage('error', '❌ ' + (data.message || 'Erro ao alterar senha'));
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showMessage('error', '❌ Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Salvar preferências
  const salvarPreferencias = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/configuracoes/${user.id}/preferencias`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferencias),
        },
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', '✅ Preferências atualizadas com sucesso!');
      } else {
        showMessage(
          'error',
          '❌ ' + (data.message || 'Erro ao atualizar preferências'),
        );
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      showMessage('error', '❌ Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Exportar dados
  const exportarDados = async () => {
    try {
      const response = await fetch(
        `${API_URL}/configuracoes/${user.id}/exportar`,
      );
      const data = await response.json();

      if (data.success) {
        // Criar arquivo JSON para download
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        showMessage('success', '✅ Dados exportados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showMessage('error', '❌ Erro ao exportar dados');
    }
  };

  // Excluir conta
  const excluirConta = async () => {
    const confirmacao = prompt('Digite "EXCLUIR MINHA CONTA" para confirmar:');

    if (confirmacao !== 'EXCLUIR MINHA CONTA') {
      showMessage('error', '❌ Confirmação incorreta');
      return;
    }

    const senhaConfirmacao = prompt('Digite sua senha para confirmar:');

    if (!senhaConfirmacao) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/configuracoes/${user.id}/excluir`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senha: senhaConfirmacao,
            confirmacao: 'EXCLUIR MINHA CONTA',
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(
          'Conta excluída com sucesso. Você será redirecionado para a página de login.',
        );
        window.location.href = '/login';
      } else {
        showMessage('error', '❌ ' + (data.message || 'Erro ao excluir conta'));
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showMessage('error', '❌ Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (diaId) => {
    setPreferencias((prev) => ({
      ...prev,
      studyDays: prev.studyDays.includes(diaId)
        ? prev.studyDays.filter((d) => d !== diaId)
        : [...prev.studyDays, diaId],
    }));
  };

  // RENDERIZAÇÃO DAS ABAS

  const renderPerfil = () => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ marginBottom: '25px', fontSize: '1.3rem' }}>
        👤 Informações da Conta
      </h3>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Nome Completo
        </label>
        <input
          type="text"
          value={perfil.name}
          onChange={(e) => setPerfil({ ...perfil, name: e.target.value })}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#667eea')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={perfil.email}
          onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#667eea')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Vestibular
        </label>
        <select
          value={perfil.vestibular}
          onChange={(e) => setPerfil({ ...perfil, vestibular: e.target.value })}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="enem">ENEM</option>
          <option value="fuvest">FUVEST</option>
          <option value="unicamp">UNICAMP</option>
          <option value="unesp">UNESP</option>
        </select>
      </div>

      <button
        onClick={salvarPerfil}
        disabled={loading}
        style={{
          padding: '12px 30px',
          borderRadius: '8px',
          border: 'none',
          background: loading
            ? '#9ca3af'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: '600',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        }}
      >
        {loading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
      </button>
    </div>
  );

  const renderSeguranca = () => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ marginBottom: '25px', fontSize: '1.3rem' }}>🔒 Segurança</h3>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Senha Atual
        </label>
        <input
          type="password"
          value={senha.senhaAtual}
          onChange={(e) => setSenha({ ...senha, senhaAtual: e.target.value })}
          placeholder="Digite sua senha atual"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Nova Senha
        </label>
        <input
          type="password"
          value={senha.novaSenha}
          onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })}
          placeholder="Digite sua nova senha (mín. 6 caracteres)"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Confirmar Nova Senha
        </label>
        <input
          type="password"
          value={senha.confirmarSenha}
          onChange={(e) =>
            setSenha({ ...senha, confirmarSenha: e.target.value })
          }
          placeholder="Digite novamente a nova senha"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      {senha.novaSenha &&
        senha.confirmarSenha &&
        senha.novaSenha !== senha.confirmarSenha && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '2px solid #ef4444',
              color: '#991b1b',
              marginBottom: '20px',
            }}
          >
            ⚠️ As senhas não conferem
          </div>
        )}

      <button
        onClick={alterarSenha}
        disabled={
          loading ||
          !senha.senhaAtual ||
          !senha.novaSenha ||
          senha.novaSenha !== senha.confirmarSenha
        }
        style={{
          padding: '12px 30px',
          borderRadius: '8px',
          border: 'none',
          background:
            loading ||
            !senha.senhaAtual ||
            !senha.novaSenha ||
            senha.novaSenha !== senha.confirmarSenha
              ? '#9ca3af'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: '600',
          fontSize: '1rem',
          cursor:
            loading ||
            !senha.senhaAtual ||
            !senha.novaSenha ||
            senha.novaSenha !== senha.confirmarSenha
              ? 'not-allowed'
              : 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        }}
      >
        {loading ? '⏳ Alterando...' : '🔐 Alterar Senha'}
      </button>
    </div>
  );

  const renderPreferencias = () => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ marginBottom: '25px', fontSize: '1.3rem' }}>
        ⚙️ Preferências
      </h3>

      {/* Notificações */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          borderRadius: '8px',
          background: '#f9fafb',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          <input
            type="checkbox"
            checked={preferencias.emailNotifications}
            onChange={(e) =>
              setPreferencias({
                ...preferencias,
                emailNotifications: e.target.checked,
              })
            }
            style={{
              width: '20px',
              height: '20px',
              marginRight: '12px',
              cursor: 'pointer',
            }}
          />
          📧 Receber notificações por email
        </label>
        <p
          style={{
            margin: '8px 0 0 32px',
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          Receba lembretes e atualizações importantes
        </p>
      </div>

      {/* Horas por dia */}
      <div style={{ marginBottom: '30px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Horas de Estudo por Dia: {preferencias.hoursPerDay}h
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={preferencias.hoursPerDay}
          onChange={(e) =>
            setPreferencias({
              ...preferencias,
              hoursPerDay: parseInt(e.target.value),
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
            marginTop: '5px',
          }}
        >
          <span>1h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Dias da semana */}
      <div style={{ marginBottom: '30px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Dias de Estudo Preferidos
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
          }}
        >
          {diasSemana.map((dia) => (
            <button
              key={dia.id}
              type="button"
              onClick={() => toggleDia(dia.id)}
              style={{
                padding: '12px 8px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: preferencias.studyDays.includes(dia.id)
                  ? '#667eea'
                  : '#e5e7eb',
                background: preferencias.studyDays.includes(dia.id)
                  ? '#667eea'
                  : 'white',
                color: preferencias.studyDays.includes(dia.id)
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

      <button
        onClick={salvarPreferencias}
        disabled={loading}
        style={{
          padding: '12px 30px',
          borderRadius: '8px',
          border: 'none',
          background: loading
            ? '#9ca3af'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: '600',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        }}
      >
        {loading ? '⏳ Salvando...' : '💾 Salvar Preferências'}
      </button>
    </div>
  );

  const renderDadosPrivacidade = () => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ marginBottom: '25px', fontSize: '1.3rem' }}>
        🔐 Dados & Privacidade
      </h3>

      {/* Exportar dados */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          borderRadius: '8px',
          background: '#f0fdf4',
          border: '2px solid #10b981',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', color: '#065f46' }}>
          📥 Exportar Meus Dados
        </h4>
        <p
          style={{
            margin: '0 0 15px 0',
            color: '#047857',
            fontSize: '0.95rem',
          }}
        >
          Baixe todos os seus dados em formato JSON
        </p>
        <button
          onClick={exportarDados}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          💾 Exportar Dados
        </button>
      </div>

      {/* Excluir conta */}
      <div
        style={{
          padding: '20px',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '2px solid #ef4444',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>
          ⚠️ Zona de Perigo
        </h4>
        <p
          style={{
            margin: '0 0 15px 0',
            color: '#dc2626',
            fontSize: '0.95rem',
          }}
        >
          Esta ação é irreversível. Todos os seus dados serão permanentemente
          excluídos.
        </p>
        <button
          onClick={excluirConta}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#9ca3af' : '#ef4444',
            color: 'white',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Processando...' : '🗑️ Excluir Minha Conta'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          color: 'white',
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>
          ⚙️ Configurações
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Mensagem de feedback */}
      {message.text && (
        <div
          style={{
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            background:
              message.type === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '500',
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          overflowX: 'auto',
          paddingBottom: '5px',
        }}
      >
        {[
          { id: 'perfil', label: '👤 Perfil', icon: '👤' },
          { id: 'seguranca', label: '🔒 Segurança', icon: '🔒' },
          { id: 'preferencias', label: '⚙️ Preferências', icon: '⚙️' },
          { id: 'dados', label: '🔐 Dados', icon: '🔐' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background:
                activeTab === tab.id
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'perfil' && renderPerfil()}
      {activeTab === 'seguranca' && renderSeguranca()}
      {activeTab === 'preferencias' && renderPreferencias()}
      {activeTab === 'dados' && renderDadosPrivacidade()}

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
    </div>
  );
};

export default Configuracoes;
