// ============================================
// backend/scripts/initAchievements.js
// Execute este script UMA VEZ para popular as conquistas
// ============================================

const { pool } = require('../src/config/database');

const achievements = [
  {
    key: 'first_task',
    name: 'Primeira Conquista',
    description: 'Complete sua primeira tarefa',
    icon: '🎯',
    xp: 50,
    type: 'tasks',
    value: 1,
  },
  {
    key: 'streak_7',
    name: 'Sequência de 7 dias',
    description: 'Mantenha uma sequência de 7 dias',
    icon: '🔥',
    xp: 100,
    type: 'streak',
    value: 7,
  },
  {
    key: 'level_10',
    name: 'Nível 10',
    description: 'Alcance o nível 10',
    icon: '⭐',
    xp: 200,
    type: 'level',
    value: 10,
  },
  {
    key: 'tasks_100',
    name: 'Mestre da Produtividade',
    description: 'Complete 100 tarefas',
    icon: '👑',
    xp: 500,
    type: 'tasks',
    value: 100,
  },
  {
    key: 'streak_30',
    name: 'Sequência de 30 dias',
    description: 'Mantenha uma sequência de 30 dias',
    icon: '💎',
    xp: 1000,
    type: 'streak',
    value: 30,
  },
  {
    key: 'level_20',
    name: 'Nível 20',
    description: 'Alcance o nível 20',
    icon: '🏆',
    xp: 500,
    type: 'level',
    value: 20,
  },
  {
    key: 'questions_500',
    name: 'Estudioso',
    description: 'Responda 500 questões',
    icon: '📚',
    xp: 300,
    type: 'questions',
    value: 500,
  },
  {
    key: 'accuracy_90',
    name: 'Precisão Absoluta',
    description: 'Mantenha 90% de acertos',
    icon: '🎓',
    xp: 400,
    type: 'accuracy',
    value: 90,
  },
];

async function initAchievements() {
  console.log('🎯 Inicializando conquistas...');

  try {
    for (const ach of achievements) {
      await pool.execute(
        `
        INSERT IGNORE INTO achievements 
        (achievement_key, name, description, icon, xp_reward, condition_type, condition_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          ach.key,
          ach.name,
          ach.description,
          ach.icon,
          ach.xp,
          ach.type,
          ach.value,
        ],
      );

      console.log(`✅ ${ach.name} cadastrada`);
    }

    console.log('\n✅ Todas as conquistas foram inicializadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar conquistas:', error);
    process.exit(1);
  }
}

initAchievements();

// ============================================
// Para executar: node backend/scripts/initAchievements.js
// ============================================
