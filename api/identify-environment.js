import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Ignora se não for POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;

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
            { 
              type: "text", 
              text: "Descreva o ambiente à frente em português do Brasil de forma curta e objetiva. Priorize a identificação do tipo de local, paredes, portas e potenciais obstáculos no caminho." 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: image,
                detail: "auto" 
              } 
            }
          ]
        }
      ]
    });

    const textoDaIA = response.choices[0].message.content;
    
    // A LINHA MÁGICA: Empacota a resposta com a etiqueta "description" exata pro Android!
    res.status(200).json({ description: textoDaIA });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
