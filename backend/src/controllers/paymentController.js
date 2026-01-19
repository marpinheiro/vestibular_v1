const { pool } = require('../config/database');
const crypto = require('crypto');

const paymentController = {
  // Listar planos disponíveis
  listarPlanos: async (req, res) => {
    try {
      const [plans] = await pool.query(
        `SELECT 
          id, name, slug, description,
          price_monthly, price_yearly,
          max_questions_per_day, max_redacoes_per_month, max_simulados_per_month,
          ai_correction, priority_support, downloadable_content,
          custom_study_plan, video_lessons, live_classes,
          sort_order
        FROM plans 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, price_monthly ASC`,
      );

      // Formatar features para o frontend
      const plansFormatted = plans.map((plan) => {
        const features = [];

        if (plan.max_questions_per_day) {
          features.push(`${plan.max_questions_per_day} questões por dia`);
        } else {
          features.push('Questões ilimitadas');
        }

        if (plan.max_simulados_per_month) {
          features.push(
            `${plan.max_simulados_per_month} simulado${plan.max_simulados_per_month > 1 ? 's' : ''} por mês`,
          );
        } else if (plan.max_simulados_per_month === null) {
          features.push('Simulados ilimitados');
        }

        if (plan.max_redacoes_per_month) {
          features.push(
            `${plan.max_redacoes_per_month} redaç${plan.max_redacoes_per_month > 1 ? 'ões' : 'ão'} por mês`,
          );
        } else if (plan.max_redacoes_per_month === null) {
          features.push('Redações ilimitadas');
        }

        if (plan.ai_correction) features.push('Correção por IA');
        if (plan.priority_support) features.push('Suporte prioritário');
        if (plan.custom_study_plan)
          features.push('Plano de estudos personalizado');
        if (plan.video_lessons) features.push('Vídeo aulas');
        if (plan.live_classes) features.push('Aulas ao vivo');
        if (plan.downloadable_content) features.push('Conteúdo para download');

        return {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          price_monthly: parseFloat(plan.price_monthly),
          price_yearly: parseFloat(plan.price_yearly),
          features: features,
        };
      });

      res.json({
        success: true,
        data: plansFormatted,
      });
    } catch (error) {
      console.error('Erro ao listar planos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar planos',
        error: error.message,
      });
    }
  },

  // Obter assinatura do usuário
  obterAssinatura: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [subscriptions] = await pool.query(
        `SELECT 
          s.*,
          p.name as plan_name,
          p.slug as plan_slug
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = ? AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1`,
        [userId],
      );

      if (subscriptions.length === 0) {
        return res.json({
          success: true,
          data: null,
        });
      }

      res.json({
        success: true,
        data: subscriptions[0],
      });
    } catch (error) {
      console.error('Erro ao obter assinatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter assinatura',
        error: error.message,
      });
    }
  },

  // Processar pagamento
  processarPagamento: async (req, res) => {
    try {
      const userId = req.params.userId;
      const {
        planId,
        billingType, // 'monthly' ou 'yearly'
        paymentMethod,
        cardData,
        couponCode,
      } = req.body;

      // Validações
      if (!planId || !billingType || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message:
            'Plano, tipo de cobrança e método de pagamento são obrigatórios',
        });
      }

      // Buscar plano
      const [plans] = await pool.query(
        'SELECT * FROM plans WHERE id = ? AND is_active = 1',
        [planId],
      );

      if (plans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plano não encontrado',
        });
      }

      const plan = plans[0];

      // Determinar valor
      let amount =
        billingType === 'yearly' ? plan.price_yearly : plan.price_monthly;

      // Aplicar cupom se fornecido
      let couponDiscount = 0;
      let couponId = null;

      if (couponCode) {
        const [coupons] = await pool.query(
          `SELECT * FROM coupons 
          WHERE code = ? 
          AND is_active = 1 
          AND (max_uses IS NULL OR used_count < max_uses)
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_until IS NULL OR valid_until >= NOW())`,
          [couponCode],
        );

        if (coupons.length > 0) {
          const coupon = coupons[0];
          couponId = coupon.id;

          if (coupon.discount_type === 'percentage') {
            couponDiscount = (amount * coupon.discount_value) / 100;
          } else {
            couponDiscount = coupon.discount_value;
          }

          amount = Math.max(0, amount - couponDiscount);
        }
      }

      // Validar cartão (apenas para cartão de crédito)
      if (paymentMethod === 'credit_card') {
        if (
          !cardData ||
          !cardData.number ||
          !cardData.name ||
          !cardData.expiry ||
          !cardData.cvv
        ) {
          return res.status(400).json({
            success: false,
            message: 'Dados do cartão incompletos',
          });
        }

        const cardNumber = cardData.number.replace(/\s/g, '');
        if (!validarCartao(cardNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Número de cartão inválido',
          });
        }
      }

      // Gerar ID único da transação
      const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // SIMULAÇÃO de processamento (90% sucesso)
      const paymentSuccess = Math.random() > 0.1;

      if (!paymentSuccess) {
        await pool.query(
          `INSERT INTO transactions 
          (user_id, plan_id, amount, payment_method, status, transaction_id, error_message)
          VALUES (?, ?, ?, ?, 'failed', ?, 'Pagamento recusado pelo processador')`,
          [userId, planId, amount, paymentMethod, transactionId],
        );

        return res.status(400).json({
          success: false,
          message: 'Pagamento recusado. Tente outro cartão.',
        });
      }

      // Calcular data de expiração
      const expiresAt = new Date();
      if (billingType === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (billingType === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Cancelar assinaturas anteriores
      await pool.query(
        `UPDATE subscriptions 
        SET status = 'canceled', canceled_at = NOW() 
        WHERE user_id = ? AND status = 'active'`,
        [userId],
      );

      // Criar nova assinatura
      const [subscriptionResult] = await pool.query(
        `INSERT INTO subscriptions 
        (user_id, plan_id, billing_type, status, payment_method, amount, expires_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        [userId, planId, billingType, paymentMethod, amount, expiresAt],
      );

      const subscriptionId = subscriptionResult.insertId;

      // Extrair dados do cartão
      let cardLastDigits = null;
      let cardBrand = null;
      let cardHolderName = null;

      if (paymentMethod === 'credit_card' && cardData) {
        const cardNumber = cardData.number.replace(/\s/g, '');
        cardLastDigits = cardNumber.slice(-4);
        cardBrand = detectarBandeira(cardNumber);
        cardHolderName = cardData.name;
      }

      // Registrar transação
      await pool.query(
        `INSERT INTO transactions 
        (user_id, subscription_id, plan_id, amount, payment_method, status, 
         transaction_id, card_last_digits, card_brand, card_holder_name, processed_at)
        VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, NOW())`,
        [
          userId,
          subscriptionId,
          planId,
          amount,
          paymentMethod,
          transactionId,
          cardLastDigits,
          cardBrand,
          cardHolderName,
        ],
      );

      // Registrar uso do cupom
      if (couponId) {
        await pool.query(
          'INSERT INTO coupon_usage (coupon_id, user_id, discount_applied) VALUES (?, ?, ?)',
          [couponId, userId, couponDiscount],
        );
        await pool.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
          [couponId],
        );
      }

      // Atualizar usuário
      await pool.query(
        `UPDATE users 
        SET subscription_status = 'premium', 
            subscription_plan_id = ?,
            subscription_expires_at = ?
        WHERE id = ?`,
        [planId, expiresAt, userId],
      );

      res.json({
        success: true,
        message: 'Pagamento processado com sucesso!',
        data: {
          transactionId,
          subscriptionId,
          expiresAt,
          planName: plan.name,
          amount: amount,
          originalAmount:
            billingType === 'yearly' ? plan.price_yearly : plan.price_monthly,
          discount: couponDiscount,
        },
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar pagamento',
        error: error.message,
      });
    }
  },

  // Cancelar assinatura
  cancelarAssinatura: async (req, res) => {
    try {
      const userId = req.params.userId;

      await pool.query(
        `UPDATE subscriptions 
        SET status = 'canceled', canceled_at = NOW(), auto_renew = 0
        WHERE user_id = ? AND status = 'active'`,
        [userId],
      );

      res.json({
        success: true,
        message:
          'Assinatura cancelada. Você terá acesso até o fim do período pago.',
      });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar assinatura',
        error: error.message,
      });
    }
  },

  // Histórico de transações
  historicoTransacoes: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [transactions] = await pool.query(
        `SELECT 
          t.*,
          p.name as plan_name,
          p.slug as plan_slug
        FROM transactions t
        JOIN plans p ON t.plan_id = p.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT 50`,
        [userId],
      );

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico',
        error: error.message,
      });
    }
  },

  // Validar cupom
  validarCupom: async (req, res) => {
    try {
      const { code, planId, billingType } = req.body;

      const [coupons] = await pool.query(
        `SELECT * FROM coupons 
        WHERE code = ? 
        AND is_active = 1 
        AND (max_uses IS NULL OR used_count < max_uses)
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())`,
        [code],
      );

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cupom inválido ou expirado',
        });
      }

      const coupon = coupons[0];

      // Buscar preço do plano
      const [plans] = await pool.query('SELECT * FROM plans WHERE id = ?', [
        planId,
      ]);
      if (plans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plano não encontrado',
        });
      }

      const plan = plans[0];
      const amount =
        billingType === 'yearly' ? plan.price_yearly : plan.price_monthly;

      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (amount * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      const finalAmount = Math.max(0, amount - discount);

      res.json({
        success: true,
        data: {
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_applied: discount,
          original_amount: amount,
          final_amount: finalAmount,
        },
      });
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao validar cupom',
        error: error.message,
      });
    }
  },
};

// Funções auxiliares
function validarCartao(cardNumber) {
  if (!/^\d{13,19}$/.test(cardNumber)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

function detectarBandeira(cardNumber) {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    elo: /^(4011|4312|4389|4514|5041|5066|5067|6277|6362|6363|6504|6505|6507|6509|6516)/,
  };

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  return 'Desconhecido';
}

module.exports = paymentController;
