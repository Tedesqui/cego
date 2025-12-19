import OpenAI from 'openai';

// Inicialização da OpenAI. Certifique-se de que a variável de ambiente OPENAI_API_KEY está configurada.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        const { image } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // --- PROMPT DE EQUILÍBRIO: DESCRIÇÃO RICA + NAVEGAÇÃO ---
        let promptText = `
        Você é um **Assistente de Visão Artificial Avançado** para pessoas cegas.
        Sua função é fornecer uma **descrição detalhada e imersiva do ambiente**, mas mantendo total consciência sobre a **navegação e segurança**.

        Analise a imagem e gere uma descrição em texto corrido (narrativa) seguindo esta estrutura lógica:

        1.  **Identificação do Ambiente (Contexto):** Comece definindo onde o usuário está e a atmosfera geral (ex: "Uma sala de estar ampla e bem iluminada", "Um escritório bagunçado", "Uma calçada arborizada").
        2.  **Detalhamento dos Objetos:** Descreva os objetos presentes, cores e materiais, para que o usuário possa visualizar a cena mentalmente.
        3.  **Consciência Espacial e Obstáculos (CRUCIAL):**
            * Ao descrever os objetos, **SEMPRE** informe a posição deles em relação ao usuário (à frente, à esquerda, à direita).
            * **REGRA DE OURO:** Se um objeto (mesmo que seja um móvel comum como uma mesa ou cadeira) estiver no caminho direto à frente, você deve descrevê-lo explicitamente como algo que está na frente do usuário.
            * *Exemplo Correto:* "Há uma mesa de madeira escura logo à sua frente, ocupando o centro do caminho."
            * *Exemplo Errado:* "Caminho livre. Há uma mesa na sala." (Isso é proibido se a mesa estiver na frente).

        **Objetivo:** O usuário deve ser capaz de imaginar a beleza/feura do local E saber se pode andar para frente sem bater em nada, tudo na mesma frase fluida.

        **Idioma:** Português do Brasil (pt-BR).

        Responda estritamente como um único objeto JSON:
        {
          "description": "SUA DESCRIÇÃO DETALHADA AQUI."
        }
        `;
        // --- FIM DO NOVO PROMPT ---

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // O GPT-4o é essencial aqui para entender a profundidade da imagem
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        { type: "image_url", image_url: { "url": image } },
                    ],
                },
            ],
            max_tokens: 400, // Aumentei um pouco para permitir descrições mais ricas
            temperature: 0.5, // Levemente criativo para descrever o ambiente, mas focado
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        return response.status(200).json(parsedResult);

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        return response.status(500).json({ 
            error: 'Falha interna do servidor ao analisar a imagem.', 
            description: 'Não foi possível analisar a imagem devido a um erro de servidor. Tente novamente.'
        });
    }
}
