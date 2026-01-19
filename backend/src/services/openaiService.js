const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Prompt para correção de redação ENEM
const getPromptCorrecao = (texto, tema) => {
  return `Você é um corretor especializado em redações do ENEM. Analise a seguinte redação e forneça uma avaliação detalhada seguindo as 5 competências do ENEM.

TEMA: ${tema}

REDAÇÃO:
${texto}

Avalie a redação de acordo com as 5 competências do ENEM e retorne APENAS um JSON válido no seguinte formato (sem markdown, sem comentários, apenas o JSON):

{
  "competencia1": {
    "nota": 160,
    "titulo": "Domínio da modalidade escrita formal da língua portuguesa",
    "feedback": "Análise detalhada da competência 1..."
  },
  "competencia2": {
    "nota": 180,
    "titulo": "Compreensão da proposta de redação e aplicação de conceitos",
    "feedback": "Análise detalhada da competência 2..."
  },
  "competencia3": {
    "nota": 160,
    "titulo": "Seleção, relação, organização e interpretação de informações",
    "feedback": "Análise detalhada da competência 3..."
  },
  "competencia4": {
    "nota": 180,
    "titulo": "Demonstração de conhecimento dos mecanismos linguísticos",
    "feedback": "Análise detalhada da competência 4..."
  },
  "competencia5": {
    "nota": 160,
    "titulo": "Elaboração de proposta de intervenção",
    "feedback": "Análise detalhada da competência 5..."
  },
  "feedback_geral": "Análise geral da redação, pontos fortes e fracos...",
  "sugestoes": [
    "Sugestão 1 de melhoria",
    "Sugestão 2 de melhoria",
    "Sugestão 3 de melhoria"
  ]
}

Importante:
- Cada competência vale de 0 a 200 pontos
- Seja criterioso e justo na avaliação
- Dê feedback construtivo e específico
- Aponte erros gramaticais, ortográficos e de coesão
- Elogie os pontos fortes
- Retorne APENAS o JSON, sem formatação markdown`;
};

// Corrigir redação com OpenAI
const corrigirRedacao = async (texto, tema) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um corretor especializado em redações do ENEM. Sempre retorne apenas JSON válido, sem markdown ou formatação adicional.',
          },
          {
            role: 'user',
            content: getPromptCorrecao(texto, tema),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data.choices[0].message.content;

    // Limpar markdown se houver
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    const resultado = JSON.parse(jsonContent);

    // Calcular nota total
    const notaTotal =
      resultado.competencia1.nota +
      resultado.competencia2.nota +
      resultado.competencia3.nota +
      resultado.competencia4.nota +
      resultado.competencia5.nota;

    return {
      competencia1: resultado.competencia1.nota,
      competencia2: resultado.competencia2.nota,
      competencia3: resultado.competencia3.nota,
      competencia4: resultado.competencia4.nota,
      competencia5: resultado.competencia5.nota,
      nota_total: notaTotal,
      feedback_geral: resultado.feedback_geral,
      sugestoes: JSON.stringify(resultado.sugestoes),
      detalhes: resultado,
    };
  } catch (error) {
    console.error(
      'Erro ao corrigir redação:',
      error.response?.data || error.message,
    );
    throw new Error('Erro ao processar correção com IA');
  }
};

module.exports = {
  corrigirRedacao,
};
