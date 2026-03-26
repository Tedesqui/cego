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

        // --- RECEBE A IMAGEM E O MODO (detailed ou short) ---
        const { image, mode } = request.body;
        
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // Define o modo padrão como detailed caso não venha no body
        const appMode = mode || 'detailed';

        // --- ENGENHARIA DE PROMPT HÍBRIDA (detailed +OCR+Pessoas VS short) ---
        
        // 1. Definição do Persona Comum
        let systemPrompt = `Você é um **Assistente de Visão Artificial Avançado** para pessoas cegas. Sua função é transformar imagens em descrições narrativas fluidas, úteis e seguras. Idioma: Português do Brasil (pt-BR).`;

        let promptInstrucoes = '';

        if (appMode === 'short') {
            // 👇 PROMPT PARA O TOQUE DUPLO (CURTO E OBJETIVO) 👇
            promptInstrucoes = `
            gere uma descrição **MUITO CURTA, DIRETA e OBJETIVA** da cena. 
            Use no máximo duas ou três frases curtas para resumir o que há de mais importante à frente do usuário.
            Foque apenas na identificação geral do local e em obstáculos imediatos. Sem detalhes de cores ou materiais.
            `;
        } else {
            // 👇 PROMPT PARA O ARRASTE DIREITA (DETALHADO, OCR, PESSOAS RESPEITOSAS) 👇
            promptInstrucoes = `
            gere uma **descrição imersiva e detalhada** do ambiente. Sua descrição deve ser uma narrativa fluida, organizada logicamente para que o usuário visualize a cena mentalmente.

            Siga esta estrutura narrativa:
            1.  **Identificação do Ambiente:** Comece definindo o contexto geral do local.
            2.  **Pessoas e Características (Etiqueta):** Se houver pessoas, descreva-as. Foque em: vestimenta, postura, expressão facial geral (ex: sorrindo, concentrado) e atividade que estão realizando.
            3.  **Leitura de Textos (OCR):** Identifique e leia **em voz alta** qualquer texto legível na imagem (placas, embalagens, telas, documentos). Cite o texto factualmente.
            4.  **Detalhamento dos Objetos:** Descreva objetos importantes, cores, materiais e layout.
            5.  **Consciência Espacial e Obstáculos (CRUCIAL):** Sempre informe a posição (frente, esquerda, direita) dos objetos em relação ao usuário. **REGRA DE OURO:** Se algo estiver no caminho direto à frente, descreva explicitamente como ocupando o centro do caminho.

            --- REGRAS DE ETIQUETA SOBRE PESSOAS (OBRIGATÓRIO) ---
            * **É PROIBIDO** citar defeitos físicos, cicatrizes, ou usar linguagem pejorativa.
            * **É PROIBIDO** fazer julgamentos morais sobre a aparência ou vestimenta.
            * Use linguagem neutra, descritiva e respeitosa. Prefira descrever a ação ou vestimenta (ex: "Uma pessoa usando cadeira de rodas" em vez de "um cadeirante").
            * NUNCA use termos ofensivos. O objetivo é informar sobre a presença e características gerais, não julgar.
            --- FIM DAS REGRAS DE ETIQUETA ---
            `;
        }

        // 3. Prompt Final de Formatação JSON
        let finalPromptText = `
        ${systemPrompt}
        Analise a imagem e ${promptInstrucoes}

        Responda estritamente como um único objeto JSON:
        {
          "description": "SUA DESCRIÇÃO AQUI."
        }
        `;

        // --- CHAMADA À API DA OPENAI ---
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // GPT-4o é necessário para visão + OCR + Etiqueta complexa
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: finalPromptText },
                        { type: "image_url", image_url: { "url": image } },
                    ],
                },
            ],
            // max_tokens de 400 a 500 é bom para descrições detalhadas com OCR
            max_tokens: 500, 
            // temperature 0.5 é boa para manter o foco na navegação mas permitir descrição rica
            temperature: 0.5, 
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
