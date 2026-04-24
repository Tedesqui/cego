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
      textPrompt = `O usuário fez a seguinte pergunta sobre a imagem: "${question}". Responda APENAS à pergunta de forma direta e concisa.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1, 
      messages: [
        {
          role: "system",
          content: "Você é um assistente de visão para cegos. A imagem pode ter ruído digital ou baixa iluminação, pois vem de um dispositivo vestível. NÃO se recuse a descrever a menos que a imagem esteja COMPLETAMENTE preta ou branca. Se houver qualquer vulto ou forma, descreva o que parece ser, mencionando que a visibilidade está reduzida."
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
