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
      model: "gpt-4o", // O modelo mais moderno de visão
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Descreva este ambiente para uma pessoa cega de forma clara, curta e objetiva em português do Brasil." },
            { type: "image_url", image_url: { url: image } }
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
