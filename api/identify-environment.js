import OpenAI from 'openai';

// Inicialização da OpenAI. Certifique-se de que a variável de ambiente OPENAI_API_KEY está configurada.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Presume-se que este handler está configurado para a rota /api/identify-environment
export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        // --- ADAPTAÇÃO: Removemos a variável 'contexto' ---
        const { image } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // --- NOVO PROMPT: Foco em Acessibilidade e Descrição de Ambiente ---
        let promptText = `
        Você é um **Assistente de Acessibilidade Visual**. Seu papel é analisar a imagem de uma câmera (ambiente interno ou externo) e **descrever a cena** de forma clara, concisa e útil para uma pessoa cega.

        Siga as seguintes instruções rigorosamente:
        1.  **Natureza do Ambiente:** Descreva a **natureza do ambiente** (ex: "sala de estar bem iluminada", "rua movimentada com carros", "cozinha industrial escura").
        2.  **Objetos Chave e Posição:** Identifique **objetos proeminentes** e sua **posição relativa** (ex: "Há uma cadeira vermelha à direita e um armário grande à frente"). Use termos como 'à frente', 'à direita', 'no chão', 'na parede'.
        3.  **Ação/Alerta:** Mencione algo que represente um **obstáculo** ou **alerta** (ex: degrau, buraco, escada, pessoa vindo em direção). Se não houver, diga "Não há obstáculos aparentes."
        4.  **Formato de Resposta:** A resposta deve ser uma única e fluida descrição pronta para ser lida em voz alta.
        5.  **Idioma:** A resposta deve ser em **Português do Brasil (pt-BR)**.

        Responda estritamente como um único objeto JSON. O objeto deve conter uma chave **"description"**.

        {
          "description": "SUA DESCRIÇÃO ÚNICA E CONCISA VAI AQUI."
        }
        `;
        // --- FIM DO NOVO PROMPT ---

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Modelo multimodal (texto e visão)
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
            max_tokens: 500, // Diminuindo o token para descrições concisas
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        // O resultado esperado é { "description": "..." }
        return response.status(200).json(parsedResult);

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        // Retorna um erro amigável para o frontend
        return response.status(500).json({ 
            error: 'Falha interna do servidor ao analisar a imagem.', 
            description: 'Não foi possível analisar a imagem devido a um erro de servidor. Tente novamente.'
        });
    }
}