import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, question } = req.body;

    let textPrompt = "Descreva o ambiente à frente em português do Brasil de forma curta e objetiva. Priorize a identificação do tipo de local, paredes, portas e potenciais obstáculos no caminho e SEMPRE avise se tiver pessoas no ambiente.";
    
    if (question && question.trim() !== "") {
      // PROMPT AGRESSIVO PARA FORÇAR MÚLTIPLAS RESPOSTAS
      textPrompt = `O usuário com deficiência visual enviou a seguinte solicitação de voz: "${question}". 
      REGRA ESTRITA: Esta solicitação contém MÚLTIPLAS perguntas ocultas ou explícitas. Você DEVE identificar e responder a TODAS as perguntas feitas sem omitir nenhuma. Se o usuário perguntou sobre 3 características de um objeto, forneça a resposta para as 3 características. Integre as respostas de forma natural, clara e objetiva.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2, // Um pouco mais alto para permitir a construção de respostas longas
      messages: [
        {
          role: "system",
          content: "Você é um assistente de visão para pessoas com deficiência visual. A imagem pode ter ruído digital ou baixa iluminação. NÃO se recuse a descrever a menos que a imagem esteja COMPLETAMENTE preta ou branca. Ajude o usuário com precisão absoluta."
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
