import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * BEST PRACTICES IMPLEMENTATION (2025/2026 Standards)
 * - Uses centralized SDK initialization.
 * - Separates identity from data via systemInstruction.
 * - Implements strict generation configurations for consistency.
 */

const getApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Internal factory for the Generative Model.
 * Centralizing this ensures consistent safety settings and generation configs.
 */
const createModel = (systemInstruction: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 200,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
    ],
  });
};

/**
 * Generates a hyper-personalized motivational message.
 */
export async function generateMotivationalMessage(
  username: string,
  mode: string,
  stats: {
    savedHoursWeek: number;
    streakDays: number;
    usageHours24h: number;
    goalHours: number;
    topPercentage: number;
  },
  appUsages: { name: string; minutes: number }[]
): Promise<string> {
  const systemInstruction = `
### ROLE
Eres un Analista de Bienestar Digital de élite y Coach de Productividad para la aplicación 'Lesser'.

### OBJECTIVE
Analizar los datos reales de uso de móvil del usuario y proporcionar un diagnóstico motivador, profesional y basado en datos.

### TONE & STYLE
- Profesional, elegante y empoderador.
- Usa un lenguaje sofisticado pero accesible (Español de España).
- Evita clichés aburridos; busca comparaciones intelectuales potentes.
- Sin hashtags. Emojis mínimos (máximo 1).
`;

  const model = createModel(systemInstruction);
  if (!model) {
    return `Análisis: Top ${stats.topPercentage}% con ${stats.savedHoursWeek.toFixed(1)}h ahorradas. ¡Tu disciplina es real!`;
  }

  try {
    const appsXml = appUsages
      .map((app) => `<app name="${app.name}" minutes="${app.minutes}" />`)
      .join('\n');

    const prompt = `
### USER DATA
<context>
  <username>${username}</username>
  <mode>${mode}</mode>
  <streak>${stats.streakDays} días</streak>
  <usage_24h>${stats.usageHours24h.toFixed(1)}h</usage_24h>
  <daily_goal>${stats.goalHours}h</daily_goal>
  <saved_week>${stats.savedHoursWeek.toFixed(1)}h</saved_week>
  <ranking>Top ${stats.topPercentage}%</ranking>
</context>

### APP DETAILS
<app_usages>
${appsXml}
</app_usages>

### TASK
Genera una reflexión de 35-45 palabras. 
1. Analiza si ha cumplido su meta técnica (${stats.usageHours24h.toFixed(1)}h vs ${stats.goalHours}h).
2. Menciona una app específica del listado.
3. Compara el ahorro semanal con una actividad de alto valor intelectual o recreativa.
`;

    const timeoutMs = 20000;
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), timeoutMs)
    );

    const generationPromise = (async () => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim().replace(/^"|"$/g, '');
    })();

    return await Promise.race([generationPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('CRITICAL LLM ERROR:', error);
    return `Buen trabajo. Estás en el Top ${stats.topPercentage}% mundial. Mantén ese enfoque en modo ${mode}.`;
  }
}

/**
 * Generates a supportive message for friends.
 */
export async function generateFriendSupportMessage(
  friendName: string,
  achievementType: 'STREAK' | 'USAGE_REDUCTION' | 'TOP_RANK',
  value: number
): Promise<string> {
  const systemInstruction = `
### ROLE
Eres una comunidad de apoyo ultra-positiva y moderna. 

### TASK
Tu objetivo es animar a un amigo que ha logrado un hito de desintoxicación digital.
Usa un lenguaje tipo "hype" pero con clase. 

### CONSTRAINTS
- Español de España.
- Máximo 15 palabras.
- Enfoque en el valor del tiempo ganado.
`;

  const model = createModel(systemInstruction);
  if (!model) return '¡Increíble progreso! El tiempo que recuperas hoy es la libertad del mañana.';

  try {
    const prompt = `Felicita a <friend>${friendName}</friend> por su logro de <type>${achievementType}</type> con valor de <value>${value}</value>.`;

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    );

    const generationPromise = (async () => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim().replace(/^"|"$/g, '');
    })();

    return await Promise.race([generationPromise, timeoutPromise]);
  } catch (error) {
    console.error('LLM Social Error:', error);
    return '¡Sigue así! Ganando tiempo para lo que importa.';
  }
}
