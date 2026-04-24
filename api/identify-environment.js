import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, question } = req.body;

    // Lógica inteligente: Define a instrução com base em haver ou não pergunta de áudio
    let textPrompt = "Descreva o ambiente à frente em português do Brasil de forma curta e objetiva. Priorize a identificação do tipo de local, paredes, portas e potenciais obstáculos no caminho.";
    
    if (question && question.trim() !== "") {
      // PROMPT ATUALIZADO PARA MÚLTIPLAS PERGUNTAS
      textPrompt = `O usuário com deficiência visual fez a seguinte solicitação de voz sobre a imagem: "${question}". Atenção: a solicitação pode conter MÚLTIPLAS perguntas em uma mesma frase. É crucial que você identifique e responda a TODAS as perguntas feitas. Seja claro, objetivo e unifique as respostas de forma natural e fluida, ideal para ser lida por um assistente de voz.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      // Aumentado levemente para 0.2 para permitir que a IA articule melhor respostas complexas
      temperature: 0.2, 
      messages: [
        {
          role: "system",
          content: "Você é um assistente de visão para pessoas com deficiência visual. A imagem pode ter ruído digital ou baixa iluminação. NÃO se recuse a descrever a menos que a imagem esteja COMPLETAMENTE preta ou branca. Ajude o usuário com o máximo de precisão possível com base no que você consegue enxergar."
        },
        {
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: image, detail: "auto" } }
          ]
        }
      ]
    });

    const textoDaIA = response.choices[0].message.content;
    
    res.status(200).json({ description: textoDaIA });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
