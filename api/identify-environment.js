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
      // 1. ZERA A CRIATIVIDADE: O modelo se torna estritamente literal e analítico.
      temperature: 0.0, 
      messages: [
        // 2. CONTEXTO DO SISTEMA: Define as regras inquebráveis de segurança.
        {
          role: "system",
          content: "Você é um assistente visual de segurança para pessoas com deficiência visual. Suas regras são absolutas: 1) É estritamente proibido alucinar, supor, deduzir ou inventar detalhes. 2) Descreva APENAS os objetos físicos e obstáculos estruturais que você tem 100% de certeza de estar vendo. 3) Se a imagem estiver muito escura, borrada ou ilegível, não tente adivinhar o ambiente. Responda APENAS a frase: 'A imagem está sem nitidez. Por favor, tente capturar novamente.'."
        },
        // 3. O COMANDO DO USUÁRIO: Mais focado no que importa para a locomoção.
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Descreva o ambiente à frente em português do Brasil. Seja claro, curto e muito objetivo. Priorize a identificação do tipo de local, paredes, portas e potenciais obstáculos no caminho." 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: image,
                // detail: "high" força a IA a olhar a imagem em recortes menores e mais detalhados
                detail: "high" 
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
