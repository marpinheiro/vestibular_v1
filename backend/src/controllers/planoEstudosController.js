const { pool } = require('../config/database');

const planoEstudosController = {
  // Criar novo plano de estudos
  criarPlano: async (req, res) => {
    try {
      const userId = req.params.userId;
      const {
        nome,
        objetivo,
        vestibular,
        horasPorDia,
        diasPorSemana,
        dataInicio,
        dataFim,
        materias,
      } = req.body;

      // Validações
      if (
        !nome ||
        !dataInicio ||
        !dataFim ||
        !diasPorSemana?.length ||
        !materias?.length
      ) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios não preenchidos',
        });
      }

      // Calcular total de dias
      const totalDias = calcularDiasTotais(dataInicio, dataFim, diasPorSemana);
      const horasTotal = totalDias * horasPorDia;

      // Verificar se já existe um plano ativo
      const [planosAtivos] = await pool.query(
        'SELECT id FROM study_plans WHERE user_id = ? AND ativo = 1',
        [userId],
      );

      const ativo = planosAtivos.length === 0 ? 1 : 0;

      // Inserir plano
      const [result] = await pool.query(
        `INSERT INTO study_plans 
        (user_id, nome, objetivo, vestibular, horas_por_dia, dias_por_semana, 
         data_inicio, data_fim, total_dias, horas_total, ativo, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          nome,
          objetivo || null,
          vestibular || 'enem',
          horasPorDia,
          JSON.stringify(diasPorSemana),
          dataInicio,
          dataFim,
          totalDias,
          horasTotal,
          ativo,
        ],
      );

      const planoId = result.insertId;

      // Inserir matérias do plano
      if (materias.length > 0) {
        const materiasValues = materias.map((m) => [planoId, m]);
        await pool.query(
          'INSERT INTO study_plan_subjects (plan_id, subject_name) VALUES ?',
          [materiasValues],
        );
      }

      res.json({
        success: true,
        message: 'Plano de estudos criado com sucesso',
        data: {
          id: planoId,
          ativo: ativo === 1,
        },
      });
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar plano de estudos',
        error: error.message,
      });
    }
  },

  // Listar todos os planos do usuário
  listarPlanos: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [planos] = await pool.query(
        `SELECT 
          sp.*,
          COUNT(DISTINCT sps.id) as total_materias,
          COALESCE(SUM(spr.horas_estudadas), 0) as horas_estudadas,
          COUNT(DISTINCT spr.data_registro) as dias_cumpridos
        FROM study_plans sp
        LEFT JOIN study_plan_subjects sps ON sp.id = sps.plan_id
        LEFT JOIN study_plan_records spr ON sp.id = spr.plan_id
        WHERE sp.user_id = ?
        GROUP BY sp.id
        ORDER BY sp.ativo DESC, sp.created_at DESC`,
        [userId],
      );

      // Buscar matérias de cada plano
      const planosComMaterias = await Promise.all(
        planos.map(async (plano) => {
          const [materias] = await pool.query(
            'SELECT subject_name FROM study_plan_subjects WHERE plan_id = ?',
            [plano.id],
          );

          return {
            id: plano.id,
            nome: plano.nome,
            objetivo: plano.objetivo,
            vestibular: plano.vestibular,
            horasPorDia: plano.horas_por_dia,
            diasPorSemana: JSON.parse(plano.dias_por_semana),
            dataInicio: plano.data_inicio,
            dataFim: plano.data_fim,
            ativo: plano.ativo === 1,
            criadoEm: plano.created_at,
            materias: materias.map((m) => m.subject_name),
            progresso: {
              diasCumpridos: Number(plano.dias_cumpridos),
              totalDias: plano.total_dias,
              horasEstudadas: Number(plano.horas_estudadas),
              horasTotal: plano.horas_total,
            },
          };
        }),
      );

      res.json({
        success: true,
        data: planosComMaterias,
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

  // Ativar plano
  ativarPlano: async (req, res) => {
    try {
      const userId = req.params.userId;
      const planoId = req.params.planoId;

      // Desativar todos os planos do usuário
      await pool.query('UPDATE study_plans SET ativo = 0 WHERE user_id = ?', [
        userId,
      ]);

      // Ativar o plano selecionado
      await pool.query(
        'UPDATE study_plans SET ativo = 1 WHERE id = ? AND user_id = ?',
        [planoId, userId],
      );

      res.json({
        success: true,
        message: 'Plano ativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao ativar plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ativar plano',
        error: error.message,
      });
    }
  },

  // Excluir plano
  excluirPlano: async (req, res) => {
    try {
      const userId = req.params.userId;
      const planoId = req.params.planoId;

      // Verificar se o plano pertence ao usuário
      const [plano] = await pool.query(
        'SELECT id FROM study_plans WHERE id = ? AND user_id = ?',
        [planoId, userId],
      );

      if (plano.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plano não encontrado',
        });
      }

      // Excluir registros de estudo
      await pool.query('DELETE FROM study_plan_records WHERE plan_id = ?', [
        planoId,
      ]);

      // Excluir matérias
      await pool.query('DELETE FROM study_plan_subjects WHERE plan_id = ?', [
        planoId,
      ]);

      // Excluir plano
      await pool.query('DELETE FROM study_plans WHERE id = ?', [planoId]);

      res.json({
        success: true,
        message: 'Plano excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir plano',
        error: error.message,
      });
    }
  },

  // Registrar estudo
  registrarEstudo: async (req, res) => {
    try {
      const userId = req.params.userId;
      const planoId = req.params.planoId;
      const { horas, data } = req.body;

      if (!horas || horas <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Horas inválidas',
        });
      }

      const dataRegistro = data || new Date().toISOString().split('T')[0];

      // Verificar se já existe registro para esta data
      const [registroExistente] = await pool.query(
        'SELECT id, horas_estudadas FROM study_plan_records WHERE plan_id = ? AND data_registro = ?',
        [planoId, dataRegistro],
      );

      if (registroExistente.length > 0) {
        // Atualizar registro existente
        await pool.query(
          'UPDATE study_plan_records SET horas_estudadas = horas_estudadas + ? WHERE id = ?',
          [horas, registroExistente[0].id],
        );
      } else {
        // Criar novo registro
        await pool.query(
          'INSERT INTO study_plan_records (plan_id, data_registro, horas_estudadas, created_at) VALUES (?, ?, ?, NOW())',
          [planoId, dataRegistro, horas],
        );
      }

      // Atualizar streak do usuário se for hoje
      const hoje = new Date().toISOString().split('T')[0];
      if (dataRegistro === hoje) {
        await pool.query(
          `UPDATE users 
           SET last_activity = NOW(),
               streak_days = CASE 
                 WHEN DATE(last_activity) = DATE(NOW() - INTERVAL 1 DAY) THEN streak_days + 1
                 WHEN DATE(last_activity) = DATE(NOW()) THEN streak_days
                 ELSE 1
               END
           WHERE id = ?`,
          [userId],
        );
      }

      res.json({
        success: true,
        message: 'Estudo registrado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao registrar estudo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar estudo',
        error: error.message,
      });
    }
  },

  // Obter plano ativo
  obterPlanoAtivo: async (req, res) => {
    try {
      const userId = req.params.userId;

      const [planos] = await pool.query(
        `SELECT 
          sp.*,
          COALESCE(SUM(spr.horas_estudadas), 0) as horas_estudadas,
          COUNT(DISTINCT spr.data_registro) as dias_cumpridos
        FROM study_plans sp
        LEFT JOIN study_plan_records spr ON sp.id = spr.plan_id
        WHERE sp.user_id = ? AND sp.ativo = 1
        GROUP BY sp.id`,
        [userId],
      );

      if (planos.length === 0) {
        return res.json({
          success: true,
          data: null,
        });
      }

      const plano = planos[0];

      // Buscar matérias
      const [materias] = await pool.query(
        'SELECT subject_name FROM study_plan_subjects WHERE plan_id = ?',
        [plano.id],
      );

      const planoAtivo = {
        id: plano.id,
        nome: plano.nome,
        objetivo: plano.objetivo,
        vestibular: plano.vestibular,
        horasPorDia: plano.horas_por_dia,
        diasPorSemana: JSON.parse(plano.dias_por_semana),
        dataInicio: plano.data_inicio,
        dataFim: plano.data_fim,
        ativo: true,
        criadoEm: plano.created_at,
        materias: materias.map((m) => m.subject_name),
        progresso: {
          diasCumpridos: Number(plano.dias_cumpridos),
          totalDias: plano.total_dias,
          horasEstudadas: Number(plano.horas_estudadas),
          horasTotal: plano.horas_total,
        },
      };

      res.json({
        success: true,
        data: planoAtivo,
      });
    } catch (error) {
      console.error('Erro ao obter plano ativo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter plano ativo',
        error: error.message,
      });
    }
  },
};

// Função auxiliar para calcular dias totais
function calcularDiasTotais(dataInicio, dataFim, diasSemana) {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  let dias = 0;

  const mapDias = {
    dom: 0,
    seg: 1,
    ter: 2,
    qua: 3,
    qui: 4,
    sex: 5,
    sab: 6,
  };

  const diasNumeros = diasSemana.map((d) => mapDias[d]);

  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    if (diasNumeros.includes(d.getDay())) {
      dias++;
    }
  }

  return dias;
}

module.exports = planoEstudosController;
