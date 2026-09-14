import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa o SDK do Gemini usando a variável de ambiente configurada na Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, question } = req.body;

    // PROMPT PADRÃO BLINDADO PARA ACESSIBILIDADE
    let textPrompt = `Descreva o ambiente à frente em português do Brasil de forma curta e objetiva. 
    REGRAS CRÍTICAS DE SEGURANÇA ESPACIAL: 
    1. Descreva a cena SEMPRE do objeto MAIS PRÓXIMO para o mais distante (leia a imagem de baixo para cima).
    2. Considere QUALQUER objeto físico no primeiro plano (mesas, cadeiras, balcões, lixeiras, etc.) como uma barreira que está imediatamente à frente do usuário.
    3. NUNCA use a frase "não há obstáculos" ou afirme que o caminho está livre. Você é uma IA de visão 2D e não pode garantir a segurança 3D do trajeto. Apenas descreva o que está na frente.
    4. SEMPRE avise se houver pessoas no ambiente e onde elas estão em relação aos móveis.
    5. NUNCA use asterisco (*) na descrição`;
    
    if (question && question.trim() !== "") {
      // PROMPT AGRESSIVO MANTENDO A SEGURANÇA
      textPrompt = `O usuário com deficiência visual enviou a seguinte solicitação de voz: "${question}". 
      REGRA ESTRITA: Esta solicitação contém MÚLTIPLAS perguntas ocultas ou explícitas. Você DEVE identificar e responder a TODAS as perguntas feitas sem omitir nenhuma. Integre as respostas de forma natural, clara e objetiva. 
      NUNCA afirme que o caminho está livre de obstáculos. Descreva os objetos imediatamente à frente do usuário antes de responder à pergunta. NUNCA use asterisco (*) na resposta`;
    }

    // O frontend pode enviar com o prefixo 'data:image/jpeg;base64,'. O Gemini exige apenas o dado puro.
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    // Instancia o modelo configurando as instruções de sistema rígidas
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Você é um assistente de visão estritamente focado em navegação e segurança para pessoas com deficiência visual. A imagem pode ter ruído ou baixa iluminação. NÃO se recuse a descrever a menos que a imagem esteja COMPLETAMENTE preta ou branca. Fale de forma direta, sem floreios."
    });

    // Envia a imagem e o prompt para a IA
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: textPrompt }, imagePart] }],
      generationConfig: {
        temperature: 0.2, // Mantém a temperatura baixa (igual você usava no GPT-4o) para reduzir alucinações
      }
    });

    const textoDaIA = result.response.text();
    
    res.status(200).json({ description: textoDaIA });

  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    res.status(500).json({ error: error.message });
  }
}
