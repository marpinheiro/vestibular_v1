import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Checkout = () => {
  const { user } = useAuth();
  const [view, setView] = useState('plans'); // plans, checkout, success, subscription
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingType, setBillingType] = useState('monthly'); // monthly ou yearly
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dados do cartão
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const [paymentResult, setPaymentResult] = useState(null);

  const carregarPlanos = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/payment/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  }, []);

  const carregarAssinatura = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/payment/${user.id}/subscription`,
      );
      const data = await response.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  }, [user?.id]);

  const carregarTransacoes = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/payment/${user.id}/transactions`,
      );
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarPlanos();
    if (user?.id) {
      carregarAssinatura();
      carregarTransacoes();
    }
  }, [user?.id, carregarPlanos, carregarAssinatura, carregarTransacoes]);

  const selecionarPlano = (plan, billing = 'monthly') => {
    const price = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;

    if (price === 0) {
      alert('Você já tem acesso ao plano gratuito!');
      return;
    }

    setSelectedPlan(plan);
    setBillingType(billing);
    setView('checkout');
  };

  const formatarCartao = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatarExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const processarPagamento = async () => {
    // Validações
    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
      alert('Número do cartão inválido');
      return;
    }

    if (!cardData.name) {
      alert('Nome do titular é obrigatório');
      return;
    }

    if (!cardData.expiry || cardData.expiry.length !== 5) {
      alert('Data de validade inválida');
      return;
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      alert('CVV inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/payment/${user.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingType: billingType,
          paymentMethod: 'credit_card',
          cardData: cardData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentResult(data.data);
        setView('success');
        await carregarAssinatura();
        await carregarTransacoes();
      } else {
        alert(data.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const cancelarAssinatura = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja cancelar sua assinatura? Você terá acesso até o fim do período pago.',
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/payment/${user.id}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Assinatura cancelada com sucesso');
        await carregarAssinatura();
      } else {
        alert(data.message || 'Erro ao cancelar assinatura');
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const getPreco = (plan, billing) => {
    return billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
  };

  const renderPlans = () => (
    <div>
      <h2
        style={{ marginBottom: '30px', fontSize: '2rem', textAlign: 'center' }}
      >
        Escolha seu Plano
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {plans.map((plan, index) => {
          const isFree = plan.price_monthly === 0;
          const isPremium = index === 1 || plan.slug === 'premium-monthly';

          return (
            <div
              key={plan.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: isPremium
                  ? '0 8px 30px rgba(102, 126, 234, 0.3)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                border: isPremium ? '3px solid #667eea' : '2px solid #e5e7eb',
                position: 'relative',
                transform: isPremium ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              {isPremium && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  ⭐ MAIS POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
                  {plan.name}
                </h3>

                {!isFree && (
                  <div style={{ marginBottom: '15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <button
                        onClick={() => setBillingType('monthly')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: `2px solid ${billingType === 'monthly' ? '#667eea' : '#e5e7eb'}`,
                          background:
                            billingType === 'monthly' ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        Mensal
                      </button>
                      <button
                        onClick={() => setBillingType('yearly')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: `2px solid ${billingType === 'yearly' ? '#667eea' : '#e5e7eb'}`,
                          background:
                            billingType === 'yearly' ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        Anual
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: '15px 0',
                  }}
                >
                  R${' '}
                  {getPreco(plan, isFree ? 'monthly' : billingType).toFixed(2)}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  {isFree
                    ? 'para sempre'
                    : billingType === 'monthly'
                      ? 'por mês'
                      : 'por ano'}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                    marginBottom: '20px',
                  }}
                >
                  {plan.description}
                </p>

                <div
                  style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}
                >
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ color: '#10b981', fontSize: '1.2rem' }}>
                        ✓
                      </span>
                      <span style={{ fontSize: '0.95rem' }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() =>
                  selecionarPlano(plan, isFree ? 'monthly' : billingType)
                }
                disabled={isFree}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isFree
                    ? '#9ca3af'
                    : isPremium
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#667eea',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isFree ? 'not-allowed' : 'pointer',
                  boxShadow: isFree
                    ? 'none'
                    : '0 4px 12px rgba(102, 126, 234, 0.4)',
                }}
              >
                {isFree ? 'Plano Atual' : 'Assinar Agora'}
              </button>
            </div>
          );
        })}
      </div>

      {subscription && (
        <div
          style={{
            marginTop: '40px',
            textAlign: 'center',
          }}
        >
          <button
            onClick={() => setView('subscription')}
            style={{
              padding: '12px 30px',
              borderRadius: '8px',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Gerenciar Minha Assinatura
          </button>
        </div>
      )}
    </div>
  );

  const renderCheckout = () => {
    const preco = getPreco(selectedPlan, billingType);

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => setView('plans')}
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
          <h2 style={{ marginBottom: '30px' }}>💳 Pagamento</h2>

          {/* Resumo do plano */}
          <div
            style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontWeight: '600' }}>Plano:</span>
              <span>{selectedPlan?.name}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontWeight: '600' }}>Período:</span>
              <span>{billingType === 'monthly' ? '1 mês' : '1 ano'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '2px solid #e5e7eb',
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              <span>Total:</span>
              <span style={{ color: '#667eea' }}>R$ {preco.toFixed(2)}</span>
            </div>
          </div>

          {/* Formulário do cartão */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Número do Cartão
              </label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) =>
                  setCardData({
                    ...cardData,
                    number: formatarCartao(e.target.value),
                  })
                }
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
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
                Nome no Cartão
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) =>
                  setCardData({
                    ...cardData,
                    name: e.target.value.toUpperCase(),
                  })
                }
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '30px',
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
                  Validade
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      expiry: formatarExpiry(e.target.value),
                    })
                  }
                  placeholder="MM/AA"
                  maxLength="5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
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
                  CVV
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                  placeholder="123"
                  maxLength="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              onClick={processarPagamento}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              {loading
                ? '⏳ Processando...'
                : `🔒 Pagar R$ ${preco.toFixed(2)}`}
            </button>

            <div
              style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              🔒 Pagamento seguro e criptografado
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '50px 40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🎉</div>

        <h2 style={{ marginBottom: '15px', color: '#10b981' }}>
          Pagamento Confirmado!
        </h2>

        <p
          style={{ color: '#6b7280', marginBottom: '30px', fontSize: '1.1rem' }}
        >
          Sua assinatura foi ativada com sucesso!
        </p>

        <div
          style={{
            background: '#f0fdf4',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <strong>Plano:</strong> {paymentResult?.planName}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Valor:</strong> R${' '}
            {parseFloat(paymentResult?.amount || 0).toFixed(2)}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>ID da Transação:</strong> {paymentResult?.transactionId}
          </div>
          <div>
            <strong>Válido até:</strong>{' '}
            {new Date(paymentResult?.expiresAt).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <button
          onClick={() => {
            setView('plans');
            setSelectedPlan(null);
            setCardData({ number: '', name: '', expiry: '', cvv: '' });
          }}
          style={{
            padding: '14px 40px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}
        >
          Voltar para Planos
        </button>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => setView('plans')}
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

      {subscription && (
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            marginBottom: '30px',
          }}
        >
          <h2 style={{ marginBottom: '25px' }}>📋 Minha Assinatura</h2>

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
                background: '#f0fdf4',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #10b981',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#065f46',
                  marginBottom: '5px',
                }}
              >
                Plano Atual
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                }}
              >
                {subscription.plan_name}
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
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  marginBottom: '5px',
                }}
              >
                Status
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#667eea',
                }}
              >
                {subscription.status === 'active' ? 'Ativo' : 'Cancelado'}
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
                  fontSize: '0.85rem',
                  color: '#92400e',
                  marginBottom: '5px',
                }}
              >
                Válido até
              </div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#f59e0b',
                }}
              >
                {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {subscription.status === 'active' && (
            <button
              onClick={cancelarAssinatura}
              disabled={loading}
              style={{
                padding: '12px 30px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#9ca3af' : '#ef4444',
                color: 'white',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Processando...' : 'Cancelar Assinatura'}
            </button>
          )}
        </div>
      )}

      {/* Histórico de Transações */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginBottom: '20px' }}>📜 Histórico de Pagamentos</h3>

        {transactions.length === 0 ? (
          <p
            style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}
          >
            Nenhum pagamento realizado ainda
          </p>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            {transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: `2px solid ${tx.status === 'completed' ? '#10b981' : '#ef4444'}`,
                  background: tx.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{tx.plan_name}</span>
                  <span
                    style={{
                      background:
                        tx.status === 'completed' ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {tx.status === 'completed' ? 'Aprovado' : 'Falhou'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  <div>Valor: R$ {parseFloat(tx.amount).toFixed(2)}</div>
                  <div>
                    Data: {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {tx.card_last_digits && (
                    <div>
                      Cartão: •••• {tx.card_last_digits} ({tx.card_brand})
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                    ID: {tx.transaction_id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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
          💳 Planos e Pagamentos
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Escolha o melhor plano para você e turbine seus estudos
        </p>
      </div>

      {/* Conteúdo */}
      {view === 'plans' && renderPlans()}
      {view === 'checkout' && renderCheckout()}
      {view === 'success' && renderSuccess()}
      {view === 'subscription' && renderSubscription()}
    </div>
  );
};

export default Checkout;
